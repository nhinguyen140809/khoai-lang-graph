import { describe, expect, it } from 'vitest'

import { speechLangOf } from '../speech-lang.utils'

describe('speechLangOf', () => {
  it.each([
    ['Phân tích đã hoàn thành, bạn xem lại giúp mình nhé', 'vi-VN'],
    ['要件の分析が終わりました', 'ja-JP'],
    ['분석이 끝났습니다', 'ko-KR'],
    ['需求分析已经完成', 'zh-CN'],
    ['Анализ завершён', 'ru-RU'],
  ])('tells the language of %j: %s', (text, lang) => {
    expect(speechLangOf(text)).toBe(lang)
  })

  it('leaves a text to the language of the browser when its letters are not its own', () => {
    expect(speechLangOf('The analysis is done')).toBeUndefined()
    expect(speechLangOf("L'analyse est terminée, à très bientôt")).toBeUndefined()
    expect(speechLangOf('')).toBeUndefined()
  })
})
