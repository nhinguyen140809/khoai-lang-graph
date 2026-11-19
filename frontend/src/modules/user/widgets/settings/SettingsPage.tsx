import { ThemePicker } from '@/modules/user/features/theme'
import { LayoutChoice, layoutChoiceMessages } from '@/modules/user/features/view'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

export function SettingsPage() {
  return (
    <ScrollArea selfScrolling className="h-full min-h-0 flex-1">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>{layoutChoiceMessages.title}</CardTitle>
            <CardDescription>{layoutChoiceMessages.hint}</CardDescription>
          </CardHeader>
          <CardContent>
            <LayoutChoice marksViewOnShow />
          </CardContent>
        </Card>
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
    </ScrollArea>
  )
}
