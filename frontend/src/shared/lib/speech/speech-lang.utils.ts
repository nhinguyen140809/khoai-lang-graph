// The letters that only Vietnamese uses: its own base letters and the letters with a mark below or
// above them, which the languages that share its other accents do not have.
const vietnameseLetters = /[ăđơưạảãấầẩẫậắằẳẵặẹẻẽếềểễệỉĩịọỏốồổỗộớờởỡợụủũứừửữựỳỷỹỵ]/gi

/** One way to tell a language: whether a text shows it, and the tag of the voice that reads it. */
interface LangRule {
  lang: string
  shows: (text: string) => boolean
}

// The rules in the order they are tried: the first that a text shows names its language. A new
// language is a new entry; the script of a language comes before the languages that share letters.
const langRules: LangRule[] = [
  { lang: 'ja-JP', shows: (text) => /[\u3040-\u30ff]/.test(text) },
  { lang: 'ko-KR', shows: (text) => /[\uac00-\ud7af]/.test(text) },
  { lang: 'zh-CN', shows: (text) => /[\u4e00-\u9fff]/.test(text) },
  { lang: 'ru-RU', shows: (text) => /[\u0400-\u04ff]/.test(text) },
  { lang: 'vi-VN', shows: (text) => (text.match(vietnameseLetters)?.length ?? 0) >= 2 },
]

/**
 * The language a text is written in, as the tag of a voice, from the letters it uses: the languages
 * with a script or letters of their own are told apart this way, and the others are left to the
 * language of the browser, which is `undefined`. A browser does not tell the language of a text on
 * its own, so a voice would otherwise read it in the language of the browser.
 */
export function speechLangOf(text: string): string | undefined {
  return langRules.find((rule) => rule.shows(text))?.lang
}
