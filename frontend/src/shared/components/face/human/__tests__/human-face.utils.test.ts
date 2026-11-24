import { Avatar, Style } from '@dicebear/core'
import { describe, expect, it } from 'vitest'

import { eyesMidline, faceArt, faceCatalog, faceCrop } from '../human-face.constants'
import {
  drawFace,
  elementsOf,
  eyeLayerMarkup,
  eyeShapeOf,
  eyesOf,
  eyesSlotId,
  faceMarkup,
  familyOf,
  optionsOf,
  paletteOf,
  palettesFitting,
  partOf,
  placeholderOf,
  randomOf,
  randomSpec,
  spotOf,
  tokensOf,
  tokenVar,
  variantOf,
  variantsFitting,
  withOwnMaskIds,
  withTokens,
} from '../human-face.utils'

const none = { mouth: null }

describe('placeholderOf', () => {
  it('gives every role a stand-in color of its own', () => {
    const colors = faceCatalog.colors.map(({ role }) => placeholderOf(role))

    expect(new Set(colors).size).toBe(colors.length)
    expect(colors.every((color) => /^#[0-9a-f]{6}$/.test(color))).toBe(true)
  })
})

describe('tokensOf', () => {
  it('takes the colors of one natural palette by the seed, which go together', () => {
    const palette = paletteOf(null, 'ada')
    const tokens = tokensOf(null, 'ada')

    expect(palette?.key).not.toBe('ink')
    expect(tokens.skin).toBe(palette?.tokens.skin)
    expect(tokens.hair).toBe(palette?.tokens.hair)
    expect(tokens.eyes).toBe(palette?.tokens.eyes)
  })

  it('takes the palette that the spec names, black on white for the palette of ink', () => {
    const tokens = tokensOf({ style: 'plain', palette: 'ink', parts: {}, colors: {} }, 'ada')

    expect(tokens.skin).toBe('paper')
    expect(tokens.hair).toBe('ink-black')
  })

  it('takes a token that the spec names over the palette, and the palette for a name that the role does not have', () => {
    const spec = {
      style: 'plain',
      palette: 'fair-blond-blue',
      parts: {},
      colors: { skin: 'umber', hair: 'sky-blue' },
    }

    expect(tokensOf(spec, 'ada').skin).toBe('umber')
    expect(tokensOf(spec, 'ada').hair).toBe('blond')
    expect(tokensOf(spec, 'ada').eyes).toBe('blue')
  })
})

describe('the palettes', () => {
  it('pair no deep skin with gray or blue eyes, and no young face with white hair', () => {
    const deep = faceCatalog.palettes.filter(({ tokens }) =>
      ['warm-deep', 'umber', 'umber-deep'].includes(tokens.skin ?? ''),
    )

    for (const { key, tokens } of deep) {
      expect(['gray', 'blue', 'green'], key).not.toContain(tokens.eyes)
    }
    for (const { key, tokens, tags } of faceCatalog.palettes) {
      if (tokens.hair === 'white') expect(tags.age, key).toEqual(['elder'])
    }
  })

  it('list lip colors that show on the skin, and only for faces that may wear them', () => {
    const lipsOf = (key: string) =>
      faceCatalog.palettes.find((palette) => palette.key === key)?.lips

    for (const { key, tokens, lips = [] } of faceCatalog.palettes) {
      const lip = faceCatalog.colors.find(({ role }) => role === 'mouth')?.tokens ?? []
      for (const name of lips) {
        expect(lip.find(({ key: tokenKey }) => tokenKey === name)?.tags?.gender, key).not.toContain(
          'masculine',
        )
      }
      if (['warm-deep', 'umber', 'umber-deep'].includes(tokens.skin ?? '')) {
        expect(
          lips.filter((name) => !['red', 'tangerine', 'brick'].includes(name)),
          key,
        ).toEqual([])
      }
    }
    expect((lipsOf('deep-black-brown') ?? []).length).toBeGreaterThan(1)
  })

  it('give only a teen hair that is dyed', () => {
    const dyed = ['pink', 'blue', 'purple', 'green', 'teal', 'orange']
    for (const { key, tokens, tags } of faceCatalog.palettes) {
      if (dyed.includes(tokens.hair ?? '')) expect(tags.age, key).toEqual(['teen'])
    }
  })

  it('are some for the ages asked, and only for them', () => {
    expect(palettesFitting({ age: ['elder'] }).length).toBeGreaterThan(
      palettesFitting({ age: ['child'] }).length,
    )
    expect(palettesFitting({ age: ['child'] }).map(({ tokens }) => tokens.hair)).not.toContain(
      'white',
    )
  })
})

describe('tokensOf for the background', () => {
  it('takes a pastel by the seed, the same one each time, and another seed may take another', () => {
    const backgrounds = ['ada', 'bob', 'chi', 'dara', 'eli', 'fay'].map(
      (seed) => tokensOf(null, seed).background,
    )

    expect(tokensOf(null, 'ada').background).toBe(tokensOf(null, 'ada').background)
    expect(new Set(backgrounds).size).toBeGreaterThan(1)
  })

  it('takes the one that the spec names', () => {
    const spec = { style: 'plain', parts: {}, colors: { background: 'mint' } }

    expect(tokensOf(spec, 'ada').background).toBe('mint')
  })
})

describe('the gender tags', () => {
  it('give neutral only to what fits women and men alike, which is a few of the hair and none of the beards', () => {
    const neutralHair = variantsFitting('hair', { gender: ['neutral'] })

    expect(neutralHair.length).toBeGreaterThan(0)
    expect(neutralHair.length).toBeLessThan(15)
    for (const { key, tags } of neutralHair) {
      expect(tags.gender, key).toEqual(expect.arrayContaining(['feminine', 'masculine']))
    }
    expect(variantsFitting('beard', { gender: ['neutral'] })).toEqual([])
  })
})

describe('randomSpec', () => {
  it('gives a masculine or neutral face no lip color, and some feminine faces one that their palette lists', () => {
    const masculine = Array.from({ length: 30 }, (_unused, round) =>
      randomSpec({ gender: ['masculine'] }, randomOf(`m${String(round)}`)),
    )
    const feminine = Array.from({ length: 30 }, (_unused, round) =>
      randomSpec({ gender: ['feminine'] }, randomOf(`f${String(round)}`)),
    )
    const worn = feminine.filter(({ colors }) => colors.mouth !== undefined)

    const neutral = Array.from({ length: 30 }, (_unused, round) =>
      randomSpec({ gender: ['neutral'] }, randomOf(`n${String(round)}`)),
    )

    expect(masculine.every(({ colors }) => colors.mouth === undefined)).toBe(true)
    expect(neutral.every(({ colors }) => colors.mouth === undefined)).toBe(true)
    expect(worn.length).toBeGreaterThan(0)
    expect(worn.length).toBeLessThan(feminine.length)
    for (const { palette, colors } of worn) {
      const lips = faceCatalog.palettes.find((candidate) => candidate.key === palette)?.lips
      expect(lips).toContain(colors.mouth)
    }
  })

  it('gives a teen a head that fits a teen', () => {
    for (let round = 0; round < 30; round += 1) {
      const { parts } = randomSpec({ age: ['teen'] }, randomOf(`t${String(round)}`))

      expect(['oval', 'round', 'wide', 'pointed-chin']).toContain(parts.head)
      expect(parts.beard ?? null).toBeNull()
    }
  })

  it('draws only variants that fit what is asked', () => {
    const wanted = { gender: ['masculine'], age: ['elder'] }
    for (let round = 0; round < 20; round += 1) {
      const { parts } = randomSpec(wanted, randomOf(`round-${String(round)}`))

      for (const [part, key] of Object.entries(parts)) {
        if (key === null) continue
        expect(variantsFitting(part, wanted).map((variant) => variant.key)).toContain(key)
      }
    }
  })

  it('gives a variant for every part that a face has to have, and a token that the catalog has', () => {
    const { parts, colors, palette } = randomSpec({}, randomOf('x'))

    expect(faceCatalog.palettes.map(({ key }) => key)).toContain(palette)

    for (const part of faceCatalog.parts.filter(({ optional }) => !optional)) {
      expect(parts[part.key], part.key).toBeDefined()
    }
    for (const [role, token] of Object.entries(colors)) {
      expect(
        faceCatalog.colors.find((color) => color.role === role)?.tokens.map(({ key }) => key),
      ).toContain(token)
    }
  })

  it('takes a palette that fits the ages asked, so a child has no white hair', () => {
    for (let round = 0; round < 30; round += 1) {
      const { palette } = randomSpec({ age: ['child'] }, randomOf(`c${String(round)}`))
      const tokens = faceCatalog.palettes.find(({ key }) => key === palette)?.tokens

      expect(tokens?.hair).not.toBe('white')
      expect(tokens?.hair).not.toBe('gray')
    }
  })

  it('gives a child of seven to ten a round head, a simple hairstyle and eyes without lashes', () => {
    for (let round = 0; round < 40; round += 1) {
      const { parts } = randomSpec({ age: ['child'] }, randomOf(`k${String(round)}`))

      expect(parts.head).toBe('round')
      expect(parts.hair).not.toBe('top-bun')
      expect(parts.eyes).not.toMatch(/lashes|lashed/)
      expect(parts.beard ?? null).toBeNull()
      expect(parts.earrings ?? null).toBeNull()
    }
  })

  it('gives a child no lipstick, only the pinks that are natural', () => {
    const lips = Array.from(
      { length: 60 },
      (_unused, round) =>
        randomSpec({ gender: ['feminine'], age: ['child'] }, randomOf(`l${String(round)}`)).colors
          .mouth,
    ).filter((token) => token !== undefined)

    for (const token of lips) expect(['rose', 'coral']).toContain(token)
  })

  it('gives glasses that fit the age: no sunglasses or reading glasses for a child', () => {
    const glasses = variantsFitting('glasses', { age: ['child'] }).map(({ key }) => key)

    expect(glasses).toEqual(['round', 'rounded-rect'])
    expect(variantsFitting('glasses', { age: ['teen'] }).map(({ key }) => key)).not.toContain(
      'half-rim',
    )
  })

  it('gives no mouth of a smirk, a grimace or a clenched jaw to a child', () => {
    const mouths = variantsFitting('mouth', { age: ['child'] }).map(({ key }) => key)

    for (const key of ['smirk-lips', 'half-smirk', 'wry', 'grimace', 'clenched-teeth']) {
      expect(mouths).not.toContain(key)
    }
    expect(mouths).toContain('tongue-out')
  })

  it('gives no curls of a woman to a man, and lashes only to women', () => {
    expect(variantsFitting('hair', { gender: ['masculine'] }).map(({ key }) => key)).not.toContain(
      'big-curls',
    )
    expect(variantsFitting('eyes', { gender: ['masculine'] }).map(({ key }) => key)).not.toContain(
      'winged-lashes',
    )
  })

  it('gives a child no oval head and no bald hair', () => {
    for (let round = 0; round < 30; round += 1) {
      const { parts } = randomSpec({ age: ['child'] }, randomOf(`h${String(round)}`))

      expect(parts.head).not.toBe('oval')
      expect(parts.hair).not.toMatch(/^bald-side/)
    }
  })

  it('is the same for the same source, and varies with it', () => {
    const faces = (text: string) => JSON.stringify(randomSpec({}, randomOf(text)))

    expect(faces('a')).toBe(faces('a'))
    expect(faces('a')).not.toBe(faces('b'))
  })

  it('says that a face has none of the optional parts that it does not have', () => {
    const { parts } = randomSpec({}, randomOf('x'))

    for (const part of faceCatalog.parts.filter(({ optional }) => optional)) {
      expect(parts, part.key).toHaveProperty(part.key)
    }
  })

  it('does not give an optional part to every face', () => {
    const had = Array.from(
      { length: 40 },
      (_unused, round) =>
        (randomSpec({}, randomOf(`r${String(round)}`)).parts.glasses ?? null) !== null,
    )

    expect(had).toContain(true)
    expect(had).toContain(false)
  })
})

describe('optionsOf', () => {
  it('leaves every part to the seed that the spec and the mood do not name', () => {
    const options = optionsOf('ada', null, none)

    expect(options.seed).toBe('ada')
    expect(
      Object.keys(options).filter((key) => key.endsWith('Variant') && key !== 'eyesVariant'),
    ).toEqual([])
  })

  it('draws the variant of the spec, and makes an optional part appear', () => {
    const spec = { style: 'plain', parts: { hair: 'mohawk', glasses: 'round' }, colors: {} }
    const options = optionsOf('ada', spec, none)

    expect(options.hairVariant).toBe(variantOf('hair', 'mohawk')?.art)
    expect(options.glassesVariant).toBe(variantOf('glasses', 'round')?.art)
    expect(options.glassesProbability).toBe(100)
    expect(options.hairProbability).toBeUndefined()
  })

  it('lets the mood draw the mouth over the spec, and keeps the eyes of the face', () => {
    const spec = { style: 'plain', parts: { eyes: 'dots', mouth: 'frown' }, colors: {} }
    const options = optionsOf('ada', spec, { mouth: 'open-oh' })

    expect(options.eyesVariant).toBe(variantOf('eyes', 'dots')?.art)
    expect(options.mouthVariant).toBe(variantOf('mouth', 'open-oh')?.art)
  })

  it('draws no part that the spec says it has none of, though the seed would have drawn it', () => {
    const spec = { style: 'plain', parts: { glasses: null, beard: null }, colors: {} }
    const options = optionsOf('ada', spec, none)

    expect(options.glassesProbability).toBe(0)
    expect(options.beardProbability).toBe(0)
    expect(options.glassesVariant).toBeUndefined()
  })

  it('skips a name that the catalog does not have', () => {
    const spec = { style: 'plain', parts: { hair: 'no-such-hair', cape: 'red' }, colors: {} }

    expect(
      Object.keys(optionsOf('ada', spec, none)).filter(
        (key) => key.endsWith('Variant') && key !== 'eyesVariant',
      ),
    ).toEqual([])
  })
})

describe('variantsFitting', () => {
  it('keeps the variants that have one of the values asked for each kind of tag', () => {
    const fits = variantsFitting('hair', { gender: ['masculine'], age: ['adult'] })

    expect(fits.length).toBeGreaterThan(0)
    expect(fits.every((variant) => variant.tags.gender?.includes('masculine'))).toBe(true)
    expect(fits.length).toBeLessThan(partOf('hair')?.variants.length ?? 0)
  })

  it('keeps every variant when nothing is asked', () => {
    expect(variantsFitting('mouth', {})).toHaveLength(partOf('mouth')?.variants.length ?? -1)
  })

  it('finds nothing of a part that the catalog does not have', () => {
    expect(variantsFitting('cape', {})).toEqual([])
  })
})

describe('the picture of a face', () => {
  const style = new Style(faceArt)
  const drawnAlone = (part: string, art: string) =>
    new Avatar(style, {
      seed: 'q',
      [`${part}Variant`]: art,
      [`${part}Probability`]: 100,
    }).toString()

  it('is cropped to the head, has no size of its own and no use of a part to place', () => {
    const markup = faceMarkup(drawnAlone('hair', 'variant01'))

    expect(markup).toContain(`viewBox="${faceCrop}"`)
    expect(markup).not.toMatch(/ (?:width|height)=/)
    expect(markup).not.toContain('<use')
    expect(markup).not.toContain('<metadata')
    expect(markup).not.toContain('url(#clip-')
  })

  it.each(
    faceCatalog.parts.flatMap((part) =>
      part.variants.map((variant) => [part.key, variant.art] as const),
    ),
  )('draws every variant of every part, with a place for its eyes: %s %s', (part, art) => {
    const markup = faceMarkup(drawnAlone(part, art))

    expect(markup).not.toContain('<use')
    expect(
      (markup.match(/<g\b[^>]*>/g)?.length ?? 0) - (markup.match(/<g\b[^>]*\/>/g)?.length ?? 0),
    ).toBe(markup.match(/<\/g>/g)?.length)
    expect(markup.match(new RegExp(`id="${eyesSlotId}"`, 'g'))).toHaveLength(1)
  })

  it('keeps the masks that a part is cut by, so that a part that refers to one is drawn whole', () => {
    const markup = faceMarkup(drawnAlone('beard', 'variant01'))

    expect(markup).toMatch(/<mask\b/)
    expect(markup).toContain('mask="url(#')
  })

  it('puts the eyes that it is given in the place of the eyes', () => {
    const markup = drawFace('ada', null, none)
    const place = /<g id="human-face-eyes-slot"(?: data-place="([^"]*)")?\/>/.exec(markup)?.[1]
    let placed: string | undefined = 'not asked'
    const elements = elementsOf(markup, (given) => {
      placed = given
      return null
    })

    expect(elements).toBeTruthy()
    expect(placed).toBe(place)
  })

  it('leaves the place of the eyes empty when it is given none', () => {
    expect(elementsOf(drawFace('ada', null, none))).toBeTruthy()
  })
  it('is painted with the custom properties of the tokens, and keeps no stand-in color', () => {
    const markup = drawFace('ada', { style: 'plain', parts: {}, colors: { hair: 'auburn' } }, none)

    expect(markup).toContain(tokenVar('hair', 'auburn'))
    expect(markup).toContain(tokenVar('skin', tokensOf(null, 'ada').skin ?? ''))
    for (const { role } of faceCatalog.colors) expect(markup).not.toContain(placeholderOf(role))
  })

  it('is drawn once for the same seed, spec and drawing', () => {
    expect(drawFace('ada', null, none)).toBe(drawFace('ada', null, none))
  })

  it('is a different face for another seed', () => {
    expect(drawFace('ada', null, none)).not.toBe(drawFace('bob', null, none))
  })
})

describe('withOwnMaskIds', () => {
  it('gives the masks of a picture an id of its own, and the parts that refer to them the same', () => {
    const markup = '<mask id="a-b"/><g mask="url(#a-b)"/>'

    expect(withOwnMaskIds(markup, 'x')).toBe('<mask id="a-b-x"/><g mask="url(#a-b-x)"/>')
  })

  it('makes two faces with the same beard and another mouth cut by their own masks', () => {
    const spec = { style: 'plain', parts: { beard: 'full' }, colors: {} }
    const ids = (mouth: string) => /<mask id="([^"]+)"/.exec(drawFace('ada', spec, { mouth }))?.[1]

    expect(ids('open-oh')).toBeDefined()
    expect(ids('open-oh')).not.toBe(ids('frown'))
  })
})

describe('withTokens', () => {
  it('paints each role with its token', () => {
    const markup = `<path fill="${placeholderOf('skin')}"/><path fill="${placeholderOf('hair')}"/>`

    expect(withTokens(markup, { skin: 'umber', hair: 'blond' })).toBe(
      `<path fill="${tokenVar('skin', 'umber')}"/><path fill="${tokenVar('hair', 'blond')}"/>`,
    )
  })
})

describe('elementsOf', () => {
  it('makes elements of the tags of the art, with their attributes in the names of React', () => {
    const element = elementsOf(
      '<svg class="a" viewBox="0 0 1 1"><g clip-path="x"><path d="M0"/></g></svg>',
    )

    expect(JSON.stringify(element)).toContain('"clipPath":"x"')
    expect(JSON.stringify(element)).toContain('"className":"a"')
  })

  it('makes the style of an element an object', () => {
    expect(JSON.stringify(elementsOf('<mask style="mask-type:alpha"/>'))).toContain(
      '"style":{"maskType":"alpha"}',
    )
  })

  it('leaves out text, and a tag that is not closed', () => {
    const elements = elementsOf('hello <svg><g>text</svg>')

    expect(JSON.stringify(elements)).not.toContain('hello')
    expect(JSON.stringify(elements)).not.toContain('text')
  })
})

describe('the eyes of a face', () => {
  it('are the ones that the spec names, or else some by the seed', () => {
    const spec = { style: 'plain', parts: { eyes: 'dots' }, colors: {} }

    expect(eyesOf('ada', spec)).toBe('dots')
    expect(eyesOf('ada', null)).toBe(eyesOf('ada', null))
    expect(variantOf('eyes', eyesOf('bob', null))).toBeDefined()
    expect(eyesOf('ada', { style: 'plain', parts: { eyes: 'none-such' }, colors: {} })).toBe(
      eyesOf('ada', null),
    )
  })

  it('are of a family, but for the few that no family has', () => {
    expect(familyOf('round-open')?.key).toBe('round')
    expect(familyOf('hearts')).toBeUndefined()
  })
})

describe('eyeShapeOf', () => {
  it('gives the eyes of the face when they are asked to rest', () => {
    expect(eyeShapeOf('round-open', 'rest', 3)).toEqual({
      variant: 'round-open',
      isFlipped: false,
      look: null,
    })
  })

  it('gives an eye of the kind asked from the family of the eyes, another than their own', () => {
    const shut = eyeShapeOf('round-open', 'shut', 0)
    const open = eyeShapeOf('round-open', 'open', 1)

    expect(familyOf('round-open')?.members.some((member) => member.variant === shut.variant)).toBe(
      true,
    )
    expect(open.variant).not.toBe('round-open')
    expect(familyOf('round-open')?.members.map((member) => member.variant)).toContain(open.variant)
  })

  it('turns an eye of a smile upside down, so that a bowl is an arch', () => {
    expect(eyeShapeOf('round-open', 'smile', 0).isFlipped).toBe(true)
  })

  it('gives the same eye to two eyes that are asked the same', () => {
    expect(eyeShapeOf('lined-open', 'half', 7)).toEqual(eyeShapeOf('lined-open', 'half', 7))
  })

  it('gives an open eye for a kind that the family has none of, and keeps the eyes of a face with no family', () => {
    expect(eyeShapeOf('lined-open', 'wide', 0).variant).not.toBe('lined-open')
    expect(eyeShapeOf('hearts', 'shut', 0)).toEqual({
      variant: 'hearts',
      isFlipped: false,
      look: null,
    })
  })
})

describe('spotOf', () => {
  it('says where the iris of each eye is, and none for an eye that has no iris', () => {
    const spot = spotOf('round-open', 'left')

    expect(spot?.size).toBeGreaterThan(0)
    expect(spotOf('round-open', 'left')?.x).toBeLessThan(eyesMidline)
    expect(spotOf('round-open', 'right')?.x).toBeGreaterThan(eyesMidline)
    expect(spotOf('closed-lines', 'left')).toBeNull()
    expect(spotOf('no-such-eyes', 'left')).toBeNull()
  })
})

describe('eyeLayerMarkup', () => {
  const shown = { isFlipped: false, hasIris: true }

  it('has the iris moved by the gaze alone, in the lid, each painted with its own role', () => {
    const markup = withTokens(eyeLayerMarkup('variant04', 'x', shown), {
      eyes: 'blue',
      eyelids: 'brown-dark',
    })
    const moved = /class="human-face-gaze">(.*?)<\/g>/.exec(markup)?.[1] ?? ''

    expect(markup.match(/class="human-face-gaze"/g)).toHaveLength(1)
    expect(moved).toContain(tokenVar('eyes', 'blue'))
    expect(moved).not.toContain(tokenVar('eyelids', 'brown-dark'))
    expect(markup.lastIndexOf(tokenVar('eyelids', 'brown-dark'))).toBeGreaterThan(
      markup.lastIndexOf(tokenVar('eyes', 'blue')),
    )
  })

  it('cuts the iris by the shape of the eye where it moves over the white of the eye', () => {
    const markup = eyeLayerMarkup('variant05', 'cut', shown)

    expect(markup).toContain('<clipPath id="cut">')
    expect(markup).toContain('clip-path="url(#cut)"')
    expect(eyeLayerMarkup('variant04', 'cut', shown)).not.toContain('clipPath')
  })

  it('moves the gleam of the eye with the iris, and the white of the eye stays where it is', () => {
    const moved = (markup: string) => /class="human-face-gaze">(.*?)<\/g>/.exec(markup)?.[1] ?? ''
    const gleam = eyeLayerMarkup('variant09', 'a', shown)
    const white = eyeLayerMarkup('variant05', 'b', shown)

    expect(moved(gleam)).toContain('fill="white"')
    expect(moved(white)).not.toContain('fill="white"')
    expect(white).toContain('fill="white"')
  })

  it('turns an eye upside down about its middle when it is flipped', () => {
    expect(eyeLayerMarkup('variant19', 'a', { ...shown, isFlipped: true })).toContain('scale(1 -1)')
    expect(eyeLayerMarkup('variant19', 'a', shown)).not.toContain('scale(1 -1)')
  })

  it('moves the iris up or down in the lid with a group of its own, apart from the gaze', () => {
    const markup = eyeLayerMarkup('variant04', 'a', shown)

    expect(markup).toMatch(/class="human-face-look"><g class="human-face-gaze"/)
  })

  it('has no iris for an eye whose iris stays in place while the lids change', () => {
    expect(eyeLayerMarkup('variant04', 'a', { ...shown, hasIris: false })).not.toContain(
      'human-face-gaze',
    )
  })

  it('has an iris that settles in from another eye about the middle of its own', () => {
    const markup = eyeLayerMarkup('variant04', 'a', { ...shown, settleAt: { x: 117, y: 55 } })

    expect(markup).toContain('class="human-face-settle" style="transform-origin: 117px 55px"')
    expect(eyeLayerMarkup('variant04', 'a', shown)).not.toContain('human-face-settle')
  })

  it('draws nothing for an eye that the art does not have', () => {
    expect(eyeLayerMarkup('variant99', 'a', shown)).toBe('')
  })
})
