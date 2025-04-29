-- Function to calculate and update facility compliance metrics
CREATE OR REPLACE FUNCTION update_facility_compliance_metrics()
RETURNS TRIGGER AS $$
DECLARE
    total_patients INTEGER;
    completed_evaluations INTEGER;
    pending_evaluations INTEGER;
    compliance_rate NUMERIC;
    facility_id UUID;
BEGIN
    -- Get the facility_id from the patient record
    SELECT p.facility_id INTO facility_id
    FROM patients p
    WHERE p.id = NEW.patient_id;

    -- Calculate metrics for the facility
    SELECT 
        COUNT(DISTINCT patient_id),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'pending')
    INTO 
        total_patients,
        completed_evaluations,
        pending_evaluations
    FROM patient_compliance_records
    WHERE facility_id = facility_id;

    -- Calculate compliance rate (completed / (completed + pending))
    IF (completed_evaluations + pending_evaluations) > 0 THEN
        compliance_rate := (completed_evaluations::NUMERIC / (completed_evaluations + pending_evaluations)::NUMERIC) * 100;
    ELSE
        compliance_rate := 0;
    END IF;

    -- Insert or update the metrics record
    INSERT INTO facility_compliance_metrics (
        facility_id,
        date,
        total_patients,
        completed_evaluations,
        pending_evaluations,
        compliance_rate
    )
    VALUES (
        facility_id,
        CURRENT_DATE,
        total_patients,
        completed_evaluations,
        pending_evaluations,
        compliance_rate
    )
    ON CONFLICT (facility_id, date) 
    DO UPDATE SET
        total_patients = EXCLUDED.total_patients,
        completed_evaluations = EXCLUDED.completed_evaluations,
        pending_evaluations = EXCLUDED.pending_evaluations,
        compliance_rate = EXCLUDED.compliance_rate,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for patient compliance records
CREATE TRIGGER update_compliance_metrics
AFTER INSERT OR UPDATE OR DELETE ON patient_compliance_records
FOR EACH ROW
EXECUTE FUNCTION update_facility_compliance_metrics();

-- Function to handle patient admission and initial compliance records
CREATE OR REPLACE FUNCTION create_initial_compliance_records()
RETURNS TRIGGER AS $$
DECLARE
    protocol RECORD;
    admission_eval RECORD;
    daily_eval RECORD;
    cyclic_eval RECORD;
BEGIN
    -- Get the active protocol for the facility
    SELECT * INTO protocol
    FROM compliance_protocols
    WHERE facility_id = NEW.facility_id
    AND is_active = true
    LIMIT 1;

    IF protocol IS NOT NULL THEN
        -- Create admission evaluation records
        FOR admission_eval IN 
            SELECT * FROM jsonb_array_elements_text(protocol.admission_evaluations)
        LOOP
            INSERT INTO patient_compliance_records (
                patient_id,
                facility_id,
                evaluation_id,
                evaluation_type,
                status,
                expected_date,
                created_at,
                updated_at
            )
            VALUES (
                NEW.id,
                NEW.facility_id,
                admission_eval::UUID,
                'admission',
                'pending',
                CURRENT_DATE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;

        -- Create daily evaluation records
        FOR daily_eval IN 
            SELECT * FROM jsonb_array_elements_text(protocol.daily_evaluations)
        LOOP
            INSERT INTO patient_compliance_records (
                patient_id,
                facility_id,
                evaluation_id,
                evaluation_type,
                status,
                expected_date,
                created_at,
                updated_at
            )
            VALUES (
                NEW.id,
                NEW.facility_id,
                daily_eval::UUID,
                'daily',
                'pending',
                CURRENT_DATE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;

        -- Create cyclic evaluation records
        FOR cyclic_eval IN 
            SELECT * FROM jsonb_array_elements(protocol.cyclic_evaluations)
        LOOP
            INSERT INTO patient_compliance_records (
                patient_id,
                facility_id,
                evaluation_id,
                evaluation_type,
                status,
                expected_date,
                created_at,
                updated_at
            )
            VALUES (
                NEW.id,
                NEW.facility_id,
                (cyclic_eval->>'evaluation_id')::UUID,
                'cyclic',
                'pending',
                CURRENT_DATE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new patient admissions
CREATE TRIGGER create_initial_compliance_records
AFTER INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION create_initial_compliance_records();

-- Function to handle patient record changes
CREATE OR REPLACE FUNCTION handle_patient_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- If patient is being deleted, mark all their compliance records as inactive
    IF TG_OP = 'DELETE' THEN
        UPDATE patient_compliance_records
        SET is_active = false,
            updated_at = CURRENT_TIMESTAMP
        WHERE patient_id = OLD.id;
        
        -- Trigger metrics update
        PERFORM update_facility_compliance_metrics();
        RETURN OLD;
    END IF;

    -- If patient is being updated
    IF TG_OP = 'UPDATE' THEN
        -- If facility_id changed, update all compliance records
        IF NEW.facility_id != OLD.facility_id THEN
            UPDATE patient_compliance_records
            SET facility_id = NEW.facility_id,
                updated_at = CURRENT_TIMESTAMP
            WHERE patient_id = NEW.id;
            
            -- Trigger metrics update for both old and new facilities
            PERFORM update_facility_compliance_metrics();
        END IF;
        RETURN NEW;
    END IF;

    -- If patient is being inserted, the create_initial_compliance_records trigger will handle it
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for patient record changes
CREATE TRIGGER monitor_patient_changes
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW
EXECUTE FUNCTION handle_patient_changes();

-- Function to monitor evaluation status changes
CREATE OR REPLACE FUNCTION monitor_evaluation_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed from pending to completed
    IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
        -- Update completed date
        NEW.completed_date := CURRENT_TIMESTAMP;
        
        -- For cyclic evaluations, schedule the next occurrence
        IF NEW.evaluation_type = 'cyclic' THEN
            -- Get the frequency from the protocol
            DECLARE
                next_date DATE;
                frequency INTEGER;
            BEGIN
                SELECT (ce->>'frequency')::INTEGER INTO frequency
                FROM compliance_protocols cp,
                     jsonb_array_elements(cp.cyclic_evaluations) ce
                WHERE cp.facility_id = NEW.facility_id
                AND cp.is_active = true
                AND (ce->>'evaluation_id')::UUID = NEW.evaluation_id
                LIMIT 1;

                IF frequency IS NOT NULL THEN
                    next_date := CURRENT_DATE + frequency;
                    
                    -- Create next cyclic evaluation
                    INSERT INTO patient_compliance_records (
                        patient_id,
                        facility_id,
                        evaluation_id,
                        evaluation_type,
                        status,
                        expected_date,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        NEW.patient_id,
                        NEW.facility_id,
                        NEW.evaluation_id,
                        'cyclic',
                        'pending',
                        next_date,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    );
                END IF;
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for evaluation status changes
CREATE TRIGGER monitor_evaluation_status
BEFORE UPDATE ON patient_compliance_records
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION monitor_evaluation_status(); 