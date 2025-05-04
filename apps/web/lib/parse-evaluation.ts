import { KipuPatientEvaluation, KipuPatientEvaluationItem, KipuFieldTypes } from "types/kipu/kipuAdapter";
import { KipuPatientEvaluationItemEnhanced } from 'types/kipu/kipuEvaluationEnhanced';

// Define the expected return structure for the parser
interface ParsedEvaluationResult {
  title: string;
  content: string;
}

// --- Inline Interfaces for Record Types (Migration Target) ---
// TODO: Migrate these to dedicated types in /types/kipu/ if confirmed stable

// Base record interface that all record types extend
interface BaseRecord {
  id?: number;
  name?: string;
  description?: string;
  value?: string;
  status?: string;
}

// Matrix record structure for evaluation items
interface MatrixRecord extends BaseRecord {
  label?: string;
  comments?: string;
  option?: string;
  columnNames?: Array<{
    key: string;
    value: string;
  }>;
  [key: string]: any; // For dynamic column values
}

// Drug history record structure
interface DrugHistoryRecord extends BaseRecord {
  drugName?: string;
  status?: string;
}

// Diagnosis record structure
interface DiagnosisRecord extends BaseRecord {
  diagnosisDescription?: string;
  code?: string;
  status?: string;
}

// Problem list record structure
interface ProblemListRecord extends BaseRecord {
  problemDescription?: string;
  status?: string;
}

// Assessment record structure (for CIWA-AR, CIWA-B, COWS)
interface AssessmentRecord extends BaseRecord {
  label?: string;
  value?: string;
  description?: string;
  score?: number;
}

// Union type for all possible record types
type EvaluationRecord = MatrixRecord | DrugHistoryRecord | DiagnosisRecord | ProblemListRecord | AssessmentRecord;

// --- End Inline Interfaces ---

export class PatientEvaluationParserService {
  /**
   * Parses a complete Patient Evaluation object into a title and content structure.
   * @param evaluation The patient evaluation object containing patientEvaluationItems.
   *                 Note: This uses the base KipuPatientEvaluation type.
   * @returns An object containing the evaluation's title and parsed content.
   */
  public parseEvaluation(evaluation: KipuPatientEvaluation): ParsedEvaluationResult {
    let explanations: string[] = [];
    if (!evaluation || !evaluation.patientEvaluationItems) {
      // Return default structure if input is invalid
      return { title: evaluation?.name || "Unknown Evaluation", content: "No content available." };
    }

    for (const item of evaluation.patientEvaluationItems) {
      const explanation = this.parseItem(item);
      if (explanation) {
        explanations.push(explanation);
      }
    }

    // Construct the result object
    const parsedContent = explanations.length > 0 
      ? explanations.join("\n\n") 
      : `Evaluation content could not be parsed. This evaluation contains ${evaluation.patientEvaluationItems.length} items, but none could be formatted for display.`;
    return {
      title: evaluation.name || "Unnamed Evaluation", // Use the evaluation's name as the title
      content: parsedContent,
    };
  }

  /**
   * Parses a single PatientEvaluationItem into a plain language explanation.
   * This typically involves processing based on the item's fieldType.
   * @param item A single PatientEvaluationItemEnhanced, which includes the 'records' field.
   * @returns A plain language explanation or null if no meaningful value is present.
   */
  private parseItem(item: KipuPatientEvaluationItemEnhanced): string | null {
    // Use name or label for the item's title
    const title: string = item.name || item.label || "Unnamed Item";
    let explanation = "";

    switch (item.fieldType) {
      // Date-related fields are now unified with proper locale formatting.
      case KipuFieldTypes.evaluation_date:
      case KipuFieldTypes.evaluation_datetime:
      case KipuFieldTypes.datestamp: {
        const dateContent = this.extractContent(item);
        if (dateContent) {
          const dateObj = new Date(dateContent);
          const formattedDate = dateObj.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          });
          explanation = `${title} occurred on ${formattedDate}`;
        }
        break;
      }

      // For text-like fields, we extract the content and strip HTML.
      case KipuFieldTypes.string:
      case KipuFieldTypes.text:
      case KipuFieldTypes.formatted_text: {
        const textContent = this.extractContent(item);
        if (textContent) {
          explanation = `${title}: ${this.stripHtml(textContent)}`;
        }
        break;
      }

      // For checkbox fields, we indicate whether it's checked or not.
      case KipuFieldTypes.check_box:
      case KipuFieldTypes.checkbox: {
        const checkboxContent = this.extractContent(item);
        if (checkboxContent !== null) {
          const isChecked =
            checkboxContent === "true" ||
            checkboxContent === "1" ||
            checkboxContent === "yes" ||
            Boolean(checkboxContent) === true;
          explanation = `${title}: ${isChecked ? "Yes" : "No"}`;
        }
        break;
      }

      // For radio buttons and select fields, we show the selected option.
      case KipuFieldTypes.radio_buttons:
      case KipuFieldTypes.drop_down_list: {
        const selectContent = this.extractContent(item);
        if (selectContent) {
          explanation = `${title}: ${this.stripHtml(selectContent)}`;
        }
        break;
      }

      // For matrix fields, we attempt to extract structured data.
      case KipuFieldTypes.matrix: {
        if (item.records && Array.isArray(item.records) && item.records.length > 0) {
          // Check if this is a matrix with column names (e.g., substance abuse matrix)
          const firstRecord = item.records[0] as MatrixRecord;
          if (firstRecord && firstRecord.columnNames && Array.isArray(firstRecord.columnNames)) {
            const matrixRows = item.records.map((record: MatrixRecord) => {
              // Get the substance or row label
              const rowLabel = record.label || record.name || "Item";
              
              // Skip empty rows (where all values are empty or NA)
              const columnNames = record.columnNames;
              if (!columnNames || !Array.isArray(columnNames)) {
                return null;
              }

              const hasValues = columnNames.some(col => {
                const key = col?.key;
                if (typeof key !== 'string') return false;
                const value = record[key as keyof typeof record];
                return value && String(value).trim() !== "" && String(value).trim().toLowerCase() !== "na";
              });
              
              if (!hasValues) {
                return null;
              }
              
              // Format the column data
              const details: string[] = [];
              columnNames.forEach(col => {
                const key = col?.key;
                if (typeof key !== 'string') return;
                const value = record[key as keyof typeof record];
                if (value && String(value).trim() !== "" && String(value).trim().toLowerCase() !== "na") {
                  details.push(`${col.value}: ${this.stripHtml(String(value))}`);
                }
              });
              
              if (details.length === 0) {
                return null;
              }
              
              return `${rowLabel}: ${details.join(", ")}`;
            }).filter(Boolean); // Remove null entries
            
            if (matrixRows.length > 0) {
              explanation = `${title}:\n- ${matrixRows.join("\n- ")}`;
            }
          } else {
            // Handle standard matrix format (e.g., treatment plans, medications)
            const matrixExplanations = item.records
              .map((record: MatrixRecord) => {
                const parts: string[] = [];
                
                if (record.label) {
                  parts.push(record.label);
                }
                if (record.value) {
                  parts.push(this.stripHtml(record.value));
                }
                if (record.description) {
                  parts.push(`Description: ${this.stripHtml(record.description)}`);
                }
                if (record.comments) {
                  parts.push(`Comments: ${this.stripHtml(record.comments)}`);
                }
                if (record.option) {
                  parts.push(`Option: ${this.stripHtml(record.option)}`);
                }
                
                return parts.join(" - ");
              })
              .filter(exp => exp.trim() !== ""); // Remove empty explanations
            
            if (matrixExplanations.length > 0) {
              explanation = `${title}:\n- ${matrixExplanations.join("\n- ")}`;
            }
          }
        }
        break;
      }

      // For points items, we show the points value.
      case KipuFieldTypes.points_item:
      case KipuFieldTypes.points_total: {
        const pointsContent = this.extractContent(item);
        if (pointsContent) {
          explanation = `${title}: ${pointsContent} points`;
        }
        break;
      }

      // For drug of choice fields, we extract the drug name.
      case KipuFieldTypes.patient_drug_of_choice: {
        if (
          item.records &&
          Array.isArray(item.records) &&
          item.records.length > 0
        ) {
          const drugs = item.records
            .map((drug) => drug.name || drug.description || drug.value || "")
            .filter((drug) => drug);
          if (drugs.length > 0) {
            explanation = `${title}: ${drugs.join(", ")}`;
          }
        }
        break;
      }

      // For drug history fields, we extract drug name and status
      case KipuFieldTypes.patient_brought_in_medication: {
        if (item.records && Array.isArray(item.records) && item.records.length > 0) {
          const drugHistories = item.records
            .map((record: DrugHistoryRecord) => {
              if (record.drugName) {
                return `${record.drugName}${record.status ? ` (${record.status})` : ''}`;
              }
              return null;
            })
            .filter(Boolean);
          if (drugHistories.length > 0) {
            explanation = `${title}:\n- ${drugHistories.join("\n- ")}`;
          }
        }
        break;
      }

      // For diagnosis fields, we extract diagnosis description and code
      case KipuFieldTypes.patient_diagnosis_code: {
        if (item.records && Array.isArray(item.records) && item.records.length > 0) {
          const diagnoses = item.records
            .map((record: DiagnosisRecord) => {
              const parts = [];
              if (record.diagnosisDescription) parts.push(record.diagnosisDescription);
              if (record.code) parts.push(`Code: ${record.code}`);
              if (record.status) parts.push(`Status: ${record.status}`);
              return parts.length > 0 ? parts.join(" - ") : null;
            })
            .filter(Boolean);
          if (diagnoses.length > 0) {
            explanation = `${title}:\n- ${diagnoses.join("\n- ")}`;
          }
        }
        break;
      }

      // For problem list fields, we extract problem description and status
      case KipuFieldTypes.problem_list: {
        if (item.records && Array.isArray(item.records) && item.records.length > 0) {
          const problems = item.records
            .map((record: ProblemListRecord) => {
              if (record.problemDescription) {
                return `${record.problemDescription}${record.status ? ` (${record.status})` : ''}`;
              }
              return null;
            })
            .filter(Boolean);
          if (problems.length > 0) {
            explanation = `${title}:\n- ${problems.join("\n- ")}`;
          }
        }
        break;
      }

      // For CIWA-AR, CIWA-B, and COWS assessments, we need special handling
      case KipuFieldTypes.patient_ciwa_ar:
      case KipuFieldTypes.patient_ciwa_b:
      case KipuFieldTypes.patient_cows: {
        if (item.records && Array.isArray(item.records) && item.records.length > 0) {
          const assessmentItems = item.records
            .map((record: any) => {
              const parts = [];
              if (record.name || record.label) parts.push(record.name || record.label);
              if (record.value) parts.push(`Score: ${record.value}`);
              if (record.description) parts.push(record.description);
              return parts.length > 0 ? parts.join(" - ") : null;
            })
            .filter(Boolean);
          if (assessmentItems.length > 0) {
            explanation = `${title}:\n- ${assessmentItems.join("\n- ")}`;
          }
        }
        break;
      }

      // For title fields, we just show the title.
      case KipuFieldTypes.title: {
        explanation = `${title}`;
        break;
      }

      // Default case for any unhandled field types
      default: {
        const content = this.extractContent(item);
        if (content) {
          explanation = `${title}: ${this.stripHtml(content)}`;
        }
        break;
      }
    }

    return explanation || null;
  }

  /**
   * Parses a single PatientEvaluationItem and extracts its content based on field type.
   * Handles simple types like TEXTAREA, TEXT, and DATE.
   * @param item The patient evaluation item (Enhanced type).
   * @returns The extracted content as a string, or null if none exists.
   */
  private extractContent(item: KipuPatientEvaluationItemEnhanced): string | null {
    if (
      item.records &&
      Array.isArray(item.records) &&
      item.records.length > 0 &&
      item.records[0]?.description
    ) {
      return item.records[0].description;
    }
    return item.description || (item.value !== undefined ? String(item.value) : null);
  }

  /**
   * Removes HTML tags from a string.
   * @param html The HTML string.
   * @returns The plain text.
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, "").trim();
  }
}
