import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'

interface SaveBarProps {
  pending: boolean
  /** A failure that is not a problem of one field. */
  error: string | null
  saved: boolean
}

/** The button that saves a form of the settings, with what came of the last save. */
export function SaveBar({ pending, error, saved }: SaveBarProps) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <Button type="submit" disabled={pending}>
        {pending && <Spinner aria-label="Saving" />}
        Save
      </Button>
      {error !== null && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      {saved && error === null && !pending && (
        <p role="status" className="text-xs text-muted-foreground">
          Saved
        </p>
      )}
    </div>
  )
}
