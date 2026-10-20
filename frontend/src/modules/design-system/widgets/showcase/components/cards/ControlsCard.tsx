'use client'

import { LayoutGridIcon, ListIcon, PinIcon, ScrollTextIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/shared/components/ui/input-group'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/shared/components/ui/input-otp'
import { Kbd } from '@/shared/components/ui/kbd'
import { Label } from '@/shared/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/shared/components/ui/native-select'
import { Progress } from '@/shared/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Slider } from '@/shared/components/ui/slider'
import { Spinner } from '@/shared/components/ui/spinner'
import { Toggle } from '@/shared/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'
import type { Tone } from '@/shared/lib/tone'

import { SampleCard } from '../Sample'

const runs: { label: string; value: number; color: Tone }[] = [
  { label: 'Run 4, interviewing', value: 45, color: 'primary' },
  { label: 'Run 3, waiting for review', value: 70, color: 'warning' },
  { label: 'Run 2, failed', value: 30, color: 'destructive' },
  { label: 'Run 1, done', value: 100, color: 'success' },
]

export function ControlsCard() {
  const [maxCost, setMaxCost] = useState([2])
  const limit = maxCost[0] ?? 0

  return (
    <SampleCard
      title="Controls"
      description="Input group, toggles, radio, slider, progress and spinner colors, native select, one-time code."
      className="flex flex-col gap-4"
    >
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search items" placeholder="Search items" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>
            <Kbd>Ctrl K</Kbd>
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <div className="flex items-center justify-between gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          defaultValue="table"
          aria-label="View"
        >
          <ToggleGroupItem value="table" aria-label="Table">
            <ListIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Cards">
            <LayoutGridIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="document" aria-label="Document">
            <ScrollTextIcon />
          </ToggleGroupItem>
        </ToggleGroup>
        <Toggle variant="outline" size="sm" aria-label="Pin the panel">
          <PinIcon />
          Pin
        </Toggle>
      </div>
      <RadioGroup defaultValue="section" aria-label="Group items by" className="flex gap-4">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="section" id="ds-group-section" />
          <Label htmlFor="ds-group-section">By section</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="kind" id="ds-group-kind" />
          <Label htmlFor="ds-group-kind">By item kind</Label>
        </div>
      </RadioGroup>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <Label htmlFor="ds-max-cost">Max cost per run</Label>
          <span className="font-mono text-muted-foreground">${limit.toFixed(2)}</span>
        </div>
        <Slider
          id="ds-max-cost"
          value={maxCost}
          onValueChange={setMaxCost}
          min={0.5}
          max={5}
          step={0.5}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span>Cost of run 3</span>
          <span className="font-mono text-muted-foreground">$0.42 of $2.00</span>
        </div>
        <Progress value={21} aria-label="Cost of run 3" />
      </div>
      <div className="flex flex-col gap-2">
        {runs.map((run) => (
          <div key={run.label} className="flex items-center gap-2 text-xs">
            <Spinner color={run.color} className={run.value === 100 ? 'invisible' : ''} />
            <span className="w-40 shrink-0">{run.label}</span>
            <Progress value={run.value} color={run.color} aria-label={run.label} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ds-export-format">
          Export format (native select, the browser draws the list)
        </Label>
        <NativeSelect id="ds-export-format" defaultValue="docx">
          <NativeSelectOption value="docx">Word document</NativeSelectOption>
          <NativeSelectOption value="pdf">PDF</NativeSelectOption>
          <NativeSelectOption value="md">Markdown</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ds-otp">Verification code</Label>
        <InputOTP id="ds-otp" maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </SampleCard>
  )
}
