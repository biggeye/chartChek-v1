'use client';

import React from 'react';
import { MessageList } from '~/components/chat/message-list';
import type { Message } from 'ai/react';

/**
 * Demo component showing the MessageList with copy and PDF functionality
 */
export function MessageListDemo() {
  const sampleMessages: Message[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Can you help me understand the patient\'s mental health assessment results?',
      createdAt: new Date(),
    },
    {
      id: 'msg-2', 
      role: 'assistant',
      content: `# Mental Health Assessment Analysis

Based on the patient's assessment results, here are the key findings:

## Current Status
- **Mood**: Patient reports improved mood stability over the past 2 weeks
- **Anxiety Levels**: Moderate anxiety, particularly in social situations
- **Sleep Patterns**: Generally good, 6-8 hours per night
- **Cognitive Function**: Alert and oriented, no significant impairments noted

## Recommendations
1. **Continue current medication regimen** - Patient responding well to current treatment
2. **Weekly therapy sessions** - Focus on anxiety management techniques
3. **Lifestyle modifications** - Regular exercise routine, mindfulness practices
4. **Follow-up appointment** - Scheduled in 4 weeks to monitor progress

## Risk Assessment
- **Low risk** for self-harm
- **Moderate support system** - Family involvement recommended
- **Good treatment compliance** - Patient actively engaged in care

This assessment indicates positive progress in the patient's mental health journey. The treatment plan should be adjusted based on ongoing monitoring and patient feedback.`,
      createdAt: new Date(),
    },
    {
      id: 'msg-3',
      role: 'user', 
      content: 'Thanks! Can you generate a summary for the treatment team?',
      createdAt: new Date(),
    },
    {
      id: 'msg-4',
      role: 'assistant',
      content: `# Treatment Team Summary

**Patient**: [Patient ID]  
**Assessment Date**: ${new Date().toLocaleDateString()}  
**Clinician**: [Clinician Name]

## Key Points for Treatment Team:

### Clinical Status
✅ **Stable mood** - Significant improvement noted  
⚠️ **Moderate anxiety** - Ongoing management needed  
✅ **Good sleep quality** - No intervention required  
✅ **Cognitive function** - Within normal limits  

### Action Items
- [ ] Psychiatrist: Review medication efficacy at next appointment
- [ ] Therapist: Focus on anxiety-specific interventions  
- [ ] Case Manager: Coordinate family involvement
- [ ] Nursing: Monitor treatment compliance

### Next Steps
- 4-week follow-up scheduled
- Weekly therapy sessions to continue
- Family meeting recommended within 2 weeks

*This summary contains PHI and should be handled according to HIPAA guidelines.*`,
      createdAt: new Date(),
    },
  ];

  return (
    <div className="h-[600px] border rounded-lg bg-background">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Message List Demo</h2>
        <p className="text-sm text-muted-foreground">
          Each assistant message has copy and PDF buttons in the bottom-right corner
        </p>
      </div>
      <div className="h-[calc(600px-80px)]">
        <MessageList messages={sampleMessages} />
      </div>
    </div>
  );
} 