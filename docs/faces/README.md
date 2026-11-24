# Faces

The vocabulary of the human faces that the app draws for its users, and the rule that keeps every
reader of it in agreement. A human face is drawn beside the faces of the agents, from a face spec:
which variant of each part, and which color token of each role.

## Contents

- [1. Files](#1-files)
- [2. What the catalog holds](#2-what-the-catalog-holds)
- [3. Rules of the catalog](#3-rules-of-the-catalog)
- [4. Who reads it](#4-who-reads-it)
- [5. Agreement with the clients](#5-agreement-with-the-clients)
- [6. The eyes](#6-the-eyes)
- [7. The face of a persona](#7-the-face-of-a-persona)
- [8. Credits](#8-credits)

## 1. Files

| File                 | Content                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `faces.catalog.json` | The catalog: styles, tag categories, parts with their variants, color roles with their tokens, palettes |
| `README.md`          | This page                                                                                               |

## 2. What the catalog holds

| List               | Entry                                                                             | Fields                                                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `styles`           | A way of drawing a human face                                                     | `key`, `title`, `package` (where the art lives), `license`                                                                                                                                                          |
| `tagCategories`    | A kind of tag                                                                     | `key`, `values`: the exact list of values the tag may take                                                                                                                                                          |
| `parts`            | A part of a face (hair, eyes, mouth, ...) of a style                              | `key`, `style`, `optional` (a face may have none), `variants`                                                                                                                                                       |
| `parts[].variants` | One drawing of a part                                                             | `key` (the semantic id), `art` (the id of the drawing in the package), `title`, `tags` (a list of values for each tag category)                                                                                     |
| `colors`           | A color role of the art (skin, hair, ...) or the pastel `background`              | `role`, `fromSeed` (optional: a face that names no token takes one by its seed), `tokens`: each a `key`, a `title` and optional `tags` (a token with none fits every tag), with no value                            |
| `eyeKinds`         | A way an eye of a family looks                                                    | the exact list: `open`, `half`, `wide`, `shut`, `smile`                                                                                                                                                             |
| `eyeFamilies`      | Eyes of a size so near that one fades into another                                | `key`, `title`, `members`: each a `variant` (an eye of the `eyes` part), a `kind`, and `isFlipped` (drawn upside down, for the `smile` kind)                                                                        |
| `palettes`         | A set of colors that go together: one token for every role that is not `fromSeed` | `key`, `title`, `tags` (the tags that the whole set fits), `fromSeed` (optional: a face with no palette may take it by its seed), `lips` (optional: lip colors that show on its skin), `tokens` (role to token key) |

A token carries no color value. The values live in one CSS file of the web app, one custom property
per token, named `--human-face-<role>-<token-key>`, so that a tone is changed in one place and a
later theme can change it again.

A face spec is the data of a user, or of a persona:

```ts
interface FaceSpec {
  style: "plain";
  palette?: PaletteKey;
  parts: Partial<Record<PartKey, VariantKey | null>>;
  colors: Partial<Record<RoleKey, TokenKey>>;
}
```

A part that the spec does not name is picked from the seed of the owner; a part that a face may go
without (glasses, a beard, ...) and that the spec sets to `null` is not drawn.

The colors come from the palette that the spec names (colors that go together: a skin, the hair,
the eyebrows and the eyes that it is usually seen with), and a token in `colors` replaces the one of
the palette for its role. A spec that names no palette takes one of the natural palettes (those marked `fromSeed`) by its
seed; the `ink` palette (black lines on white), and the dyed ones are only had
by name. Each natural palette draws the mouth in a dark tone that shows on its skin, and lists (`lips`) the lip
colors that show on that skin; a face that may wear a lip color (not a masculine one) takes one of
them, and a token in `colors` replaces it. A role marked `fromSeed` is not
in a palette: the background takes one of its pastel tokens by the seed, so that faces side by side
differ, and a pastel reads on a light page and on a dark one alike.

## 3. Rules of the catalog

| Rule                      | Detail                                                                                                                                                                                                                                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unique names              | Keys of styles, tag categories, tag values, parts, variants, tokens and palettes are unique in their list                                                                                                                                                                                                                    |
| Known names               | A variant names its part, a token names its role, a palette token names a token of its role, a tag of a variant names a value of its category                                                                                                                                                                                |
| Complete parts            | Every part of a style lists every variant of the art it maps: the `art` ids are exactly the variant ids of the package                                                                                                                                                                                                       |
| Complete colors           | Every role of a style has a token list; every palette names one token of every role that is not `fromSeed`                                                                                                                                                                                                                   |
| Palettes fit their tokens | The tags of a palette are no more than the tags of each token that it names                                                                                                                                                                                                                                                  |
| Ages                      | `child` is a child of seven to ten, `teen` of eleven to nineteen: a child has only the round head, a simple hairstyle, eyes without lashes and no dyed hair, and a mouth that a child makes                                                                                                                                  |
| Eye families              | A family has an open eye and a way to shut; an open, half or wide eye is in one family only, while the shut and smile eyes may be in several; only a `smile` eye is upside down. An eye that is in no family (`hearts`, `wink-left`, `wink-right`) keeps its own and may have a motion of its own                            |
| Tagged variants           | Every variant carries at least one value of every tag category; a variant that fits every value of a category (an eye, which has no gender) lists them all. `neutral` is only for what fits women and men alike, so a hairstyle for one gender carries that gender alone, and the beards and the earrings carry no `neutral` |

## 4. Who reads it

| Reader                                 | Uses it for                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| The web app                            | Draws a face from a spec: maps each variant key to its art, and each token to its custom property                              |
| The persona generator of the workflow  | Reads the parts, tags, titles and tokens to pick the face of each persona, as the section "The face of a persona" says          |
| The assistant tool that creates a face | Reads the parts, tags, titles and tokens to pick a spec from a request, and checks a spec against the catalog before it leaves |

## 5. Agreement with the clients

| Rule                              | Detail                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalogs agree with their clients | Every part, variant and token of `faces.catalog.json` is one that the web app draws, and the other way round. The frontend checks this against this file on every change to it or to its own code, so that a key added here fails its checks until it is built there. The art ids are checked against the package that holds the art, so that an update of the art that adds or drops a drawing fails the checks too |

## 6. The eyes

The art draws the iris and the lid of an eye as one shape, so the colors of the two cannot differ
and the iris cannot move in the lid. The web app therefore draws the eyes itself: each shape of an
eye of the art is cut in two, once, by a script, and the result is kept as data (the web app cuts
nothing while it runs). The iris is an ellipse on the thick, round part of the shape, and the lid is
what is left: the line of the lid and the lashes, with nothing dark under the iris. The two have a
role each: `eyes` is the color of the iris and `eyelids` the color of the lid. The variants of the
eyes in the catalog still name the drawings of the art, and the cut follows them one for one. The
script is `frontend/scripts/faces/split-eyes.py`, which says how to run it and how to give an eye
that comes out wrong parameters of its own.

## 7. The face of a persona

A persona item carries its face in the `face` field of its content, written by the workflow when the
personas are generated. The generator picks the spec from this catalog; the age of the person comes
from the persona itself, and the system, not the generator, turns it into the tag that the choices
must fit: the first number of the age range of the persona, below eleven a `child`, below twenty a
`teen`, below sixty-five an `adult`, and an `elder` above.

Before the spec is stored, the system checks it against this catalog and drops what does not hold,
so that the web app never reads a key that it cannot draw: a style, a palette, a part, a variant or
a token that the catalog does not list; a variant of a part that is not the part it is named for;
`null` for a part that a face may not go without; and a variant or a palette whose tags do not
carry the age of the persona. The seed of the item then draws what the spec does not name.

## 8. Credits

The art of the `plain` style is "Lorelei" by Lisa Wischofsky, released under CC0 1.0, as published in
the open style definitions of DiceBear. CC0 asks for nothing; the credit is a courtesy.
