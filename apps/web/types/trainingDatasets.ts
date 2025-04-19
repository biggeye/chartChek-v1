// Training dataset types for compliance and certification
export interface TrainingDataset {
    id: string
    name: string
    type: "Assistant" | "Responses" | "Gemini2" | "VectorStore" | "Corpora"
    typeId: string,
    description: string
    organization: string
    category: "agent" | "compliance" | "certification" | "guidelines" | "standards"
    icon?: string
  }
  
  // Available training datasets
  export const TRAINING_DATASETS: TrainingDataset[] = [
    {
      id: "tjc",
      name: "The Joint Commission",
      type: "Gemini2",
      typeId: "",
      description: "Standards and guidelines for healthcare organization accreditation",
      organization: "The Joint Commission",
      category: "compliance",
    },
    {
      id: "dhcs",
      name: "DHCS Compliance",
      type: "Gemini2",
      typeId: "",
      description: "Department of Health Care Services regulatory requirements",
      organization: "California DHCS",
      category: "compliance",
    }
    /*
    {
      id: "hipaa",
      name: "HIPAA Guidelines",
      type: ,
      typeId: ,
      description: "Health Insurance Portability and Accountability Act compliance",
      organization: "HHS Office for Civil Rights",
      category: "compliance",
    },
    {
      id: "cms",
      name: "CMS Requirements",
      type: ,
      typeId: ,
      description: "Centers for Medicare & Medicaid Services standards",
      organization: "CMS",
      category: "standards",
    },
    {
      id: "ncqa",
      name: "NCQA Standards",
      type: ,
      typeId: ,
      description: "National Committee for Quality Assurance healthcare standards",
      organization: "NCQA",
      category: "certification",
    },
    {
      id: "dnv",
      name: "DNV GL Healthcare",
      type: ,
      typeId: ,
      description: "DNV GL Healthcare accreditation program standards",
      organization: "DNV GL",
      category: "certification",
    },
    {
      id: "carf",
      name: "CARF Standards",
      type: ,
      typeId: ,
      description: "Commission on Accreditation of Rehabilitation Facilities guidelines",
      organization: "CARF International",
      category: "certification",
    },
    {
      id: "ahrq",
      name: "AHRQ Guidelines",
      type: ,
      typeId: ,
      description: "Agency for Healthcare Research and Quality best practices",
      organization: "AHRQ",
      category: "guidelines",
    },
    */
  ]
  