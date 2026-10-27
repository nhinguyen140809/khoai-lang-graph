import { ThemePicker } from '@/modules/user/features/theme'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

export function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Stored in this browser only.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePicker />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Models</CardTitle>
          <CardDescription>The model that each agent uses cannot be chosen yet.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
