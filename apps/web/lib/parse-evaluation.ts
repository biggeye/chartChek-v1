import { KipuPatientEvaluation, KipuPatientEvaluationItem, KipuFieldTypes } from "types/kipu/kipuAdapter";
import { KipuPatientEvaluationItemEnhanced } from 'types/kipu/kipuEvaluationEnhanced';

// Define the expected return structure for the parser
interface ParsedEvaluationResult {
  title: string;
  content: string;
}

// --- Inline Interfaces for Record Types (Migration Target) ---
// TODO: Migrate these to dedicated types in /types/kipu/ if confirmed stable
interface MatrixRecord { // Based on KipuFieldTypes.MATRIX usage
  label?: string;
  name?: string;
  value?: string | null;
  comments?: string;
  option?: string;
  index?: number;
  columnNames?: { key: string; value: string }[];
  [key: string]: any;
}

interface DrugHistoryRecord { // Based on KipuFieldTypes.DRUG_HISTORY usage
  drugName?: string;
  status?: string;
}

interface DiagnosisRecord { // Based on KipuFieldTypes.DIAGNOSIS usage
  diagnosisDescription?: string;
  code?: string;
  status?: string;
}

interface ProblemListRecord { // Based on KipuFieldTypes.PROBLEM_LIST usage
  problemDescription?: string;
  status?: string;
}
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
        if (
          item.records &&
          Array.isArray(item.records) &&
          item.records.length > 0
        ) {
          // Check if this is a substance abuse matrix or similar structure with columnNames
          if (item.records[0].columnNames && Array.isArray(item.records[0].columnNames) && item.records[0].columnNames.length > 0) {
            const matrixRows = item.records.map((record: MatrixRecord) => {
              // Get the substance or row label
              const rowLabel = record.label || record.name || "Item";
              
              // Skip empty rows (where all values are empty or NA)
              const hasValues = record.columnNames && record.columnNames.some((col: { key: string; value: string }) => 
                col.value && col.value.trim() !== "" && col.value.trim().toLowerCase() !== "na"
              );
              
              if (!hasValues) {
                return null;
              }
              
              // Format the column data
              let details: string[] = [];
              if (record.columnNames && Array.isArray(record.columnNames)) {
                record.columnNames.forEach(column => {
                  const key = column.key;
                  const value = record[key]; // Access value using the key from columnNames
                  if (value) { // Only add if there's a value
                    details.push(`${column.value}: ${this.stripHtml(String(value))}`);
                  }
                });
              }
              
              if (details.length === 0) {
                return null;
              }
              
              return `${rowLabel}: ${details.join(', ')}`;
            }).filter(Boolean); // Remove null entries
            
            if (matrixRows.length > 0) {
              explanation = `${title}:\n- ${matrixRows.join("\n- ")}`;
            }
          } else {
            // Handle the original matrix format
            const matrixExplanations = item.records
              .filter((record: MatrixRecord) =>
                record.value || record.comments || record.option
              )
              .map((record: MatrixRecord) => {
                let recordExp = "";
                if (record.label) {
                  recordExp += `${record.label}:`;
                }
                recordExp += record.value ? ` ${record.value}` : "";
                recordExp += record.comments ? ` (Comments: ${record.comments})` : "";
                recordExp += record.option ? ` Option: ${record.option}` : "";
                return recordExp.trim();
              })
              .join("\n");
            
            if (matrixExplanations) {
              explanation = `${title}:\n- ${matrixExplanations}`;
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

      // For diagnosis code fields, we extract the diagnosis.
      case KipuFieldTypes.patient_diagnosis_code: {
        if (
          item.records &&
          Array.isArray(item.records) &&
          item.records.length > 0
        ) {
          const diagnoses = item.records
            .map(
              (diag) =>
                `${diag.code || ""} - ${
                  diag.description || diag.name || diag.value || ""
                }`
            )
            .filter((diag) => diag && diag !== " - ");
          if (diagnoses.length > 0) {
            explanation = `${title}:\n- ${diagnoses.join("\n- ")}`;
          }
        }
        break;
      }

      // For problem list fields, we extract the problems.
      case KipuFieldTypes.problem_list: {
        if (
          item.records &&
          Array.isArray(item.records) &&
          item.records.length > 0
        ) {
          const problems = item.records
            .map((prob) => prob.description || prob.name || prob.value || "")
            .filter((prob) => prob);
          if (problems.length > 0) {
            explanation = `${title}:\n- ${problems.join("\n- ")}`;
          }
        }
        break;
      }

      // For title fields, we just show the title.
      case KipuFieldTypes.title: {
        explanation = `${title}`;
        break;
      }

      // Fallback: attempt to extract any available content.
      default: {
        const defaultContent = this.extractContent(item);
        if (defaultContent) {
          if (!isNaN(Number(defaultContent))) {
            explanation = `${title}: ${defaultContent}`;
          } else {
            explanation = `${title}: ${this.stripHtml(defaultContent)}`;
          }
        }
        break;
      }
    }

    return explanation ? explanation.trim() : null;
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
