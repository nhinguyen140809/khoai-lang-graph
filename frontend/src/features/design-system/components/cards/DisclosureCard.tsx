'use client'

import { ChevronRightIcon } from 'lucide-react'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/ui/accordion'
import { Button } from '@/shared/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'

import { SampleCard } from '../Sample'

const interviewSteps = ['4 interviewer', '5 persona_agent', '6 interviewer', '7 persona_agent']

export function DisclosureCard() {
  return (
    <SampleCard
      title="REQ-001 Search mentors"
      description="Accordion for item fields, collapsible for step groups."
      className="flex flex-col gap-3"
    >
      <Accordion type="single" collapsible defaultValue="statement">
        <AccordionItem value="statement">
          <AccordionTrigger>Statement</AccordionTrigger>
          <AccordionContent>
            The system shall let a student search mentors by field and availability.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="rationale">
          <AccordionTrigger>Rationale</AccordionTrigger>
          <AccordionContent>Students cannot find a free mentor today.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="acceptance">
          <AccordionTrigger>Acceptance criteria</AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal pl-4">
              <li>Results within 2 s for 1,000 mentors.</li>
              <li>Filters for field and availability.</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Collapsible className="flex flex-col gap-1">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="group justify-start">
            <ChevronRightIcon className="transition-transform group-data-[state=open]:rotate-90" />
            Interview PER-001, steps 4 to 27
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-0.5 pl-7 font-mono text-xs text-muted-foreground">
          {interviewSteps.map((step) => (
            <span key={step}>{step}</span>
          ))}
          <span>...</span>
        </CollapsibleContent>
      </Collapsible>
    </SampleCard>
  )
}
