import { useItem } from '@/modules/artifact/entities'
import { isString } from '@/shared/lib/guards'

/**
 * What the face of the other agent of a phase comes from: the role and the name of the persona that
 * the phase works on, such as the interviewee of an interview, so that each persona has a face of
 * its own. Undefined for a phase that works on no persona, and while the persona loads.
 */
export function usePartnerSeed(subjectItemId: string | null | undefined): string | undefined {
  const isNamed = subjectItemId !== null && subjectItemId !== undefined
  const item = useItem(subjectItemId ?? '', undefined, { isEnabled: isNamed })
  const { name, stakeholder_type: role } = item.data?.content ?? {}
  return isString(name) && isString(role) ? `${role}/${name}` : undefined
}
