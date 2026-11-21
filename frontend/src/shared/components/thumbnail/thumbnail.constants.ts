import {
  CircleHelp,
  ClipboardCheck,
  Compass,
  Eye,
  FileCheck,
  FileText,
  Flag,
  Folder,
  Library,
  Lightbulb,
  ListChecks,
  ListTodo,
  type LucideIcon,
  MessageSquareQuote,
  MessagesSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  User,
  Users,
  Workflow,
} from 'lucide-react'

/**
 * The icons that a kind can name for its thumbnail, by the name it gives: the kebab-case name of the
 * icon. A name that is not here gives a thumbnail without an icon. `diagram` is there for the kinds of
 * diagram, whose thumbnails have no icon until they name one.
 */
export const thumbnailIcons: Readonly<Record<string, LucideIcon>> = {
  user: User,
  users: Users,
  'file-text': FileText,
  'file-check': FileCheck,
  folder: Folder,
  diagram: Workflow,
  'message-square-quote': MessageSquareQuote,
  'messages-square': MessagesSquare,
  'list-checks': ListChecks,
  'list-todo': ListTodo,
  lightbulb: Lightbulb,
  flag: Flag,
  'circle-help': CircleHelp,
  'triangle-alert': TriangleAlert,
  'clipboard-check': ClipboardCheck,
  'shield-alert': ShieldAlert,
  'shield-check': ShieldCheck,
  eye: Eye,
  compass: Compass,
  library: Library,
  search: Search,
}
