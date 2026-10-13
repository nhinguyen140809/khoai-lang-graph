import { Badge } from '@/shared/ui/badge'

import { type FieldView, formatValue } from '../field-view.utils'

interface FieldValueProps {
  view: FieldView
  value: unknown
}

/** The value of one field, drawn by its widget. */
export function FieldValue({ view, value }: FieldValueProps) {
  const empty =
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  if (empty) return <span className="text-muted-foreground">-</span>

  if (view.widget === 'tags' && Array.isArray(value)) {
    return (
      <span className="flex flex-wrap gap-1">
        {value.map((entry) => (
          <Badge key={formatValue(entry)} variant="outline" color="neutral">
            {formatValue(entry)}
          </Badge>
        ))}
      </span>
    )
  }

  if (view.widget === 'list' && Array.isArray(value)) {
    return (
      <ul className="list-disc space-y-0.5 pl-4">
        {value.map((entry, index) => (
          <li key={`${String(index)}-${formatValue(entry)}`}>{formatValue(entry)}</li>
        ))}
      </ul>
    )
  }

  if (view.widget === 'object-list' && Array.isArray(value)) {
    return (
      <ul className="space-y-1.5">
        {value.map((entry, index) => {
          const record = (typeof entry === 'object' && entry !== null ? entry : {}) as Record<
            string,
            unknown
          >
          return (
            <li key={String(index)} className="rounded-md border px-2 py-1.5">
              <dl className="flex flex-col text-xs">
                {view.entryFields.map((field) => (
                  <div key={field.name} className="flex gap-x-2">
                    <dt className="w-24 shrink-0 text-muted-foreground">{field.label}</dt>
                    <dd className="min-w-0 flex-1 whitespace-pre-line">
                      {formatValue(record[field.name])}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          )
        })}
      </ul>
    )
  }

  if (view.widget === 'select')
    return (
      <Badge variant="soft" color="neutral">
        {formatValue(value)}
      </Badge>
    )

  return <span className="whitespace-pre-line">{formatValue(value)}</span>
}
