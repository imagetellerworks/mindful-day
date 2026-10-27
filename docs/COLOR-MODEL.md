# Mindful Day: authored color and emotion model

Development branch: `codex/palette-emotion-review`. Release target: `main` and the existing GitHub Pages pipeline.

## Baseline audit

Pinned main: `16cf33bc9735e027f1b9d30698d188a794b6cf83`.
Backups: `64468a3` (before mood lexicon) and `f4376cf` (before palette anchors).
`genPalette`, `hueSet`, `toneOK`, and `drawOrb` are unchanged across all three and this branch. Main nevertheless changed the inputs: narrowed hue anchors, restricted harmony modes, and assigned slot meanings. Thus main did not preserve the full original palette range. The same-seed review fixtures show identical backup inputs and different main inputs.

This revision intentionally authors new palettes following the user's later choices. It preserves the four-layer renderer and motion, with mood-specific recipe and gradient parameters rather than the old palette distribution.

## Interaction and data

Five parents: 기쁜 / 슬픈 / 화가 난 / 두려운 / 평온한. Mood advances on each tap. Each parent supplies its own fixed background; there is no background selector.

The mood control is a single horizontal button (palette swatch + current mood + cycle icon) fixed at the panel's upper left, before the orb choices. The visible category label is removed; its accessible name and tooltip explain mood cycling. Motion and sound remain below the orbs. The header stays above desktop scrolling and hides with the base controls during mobile customization. Verified at 390×844 and 1024×900, including keyboard activation, English labels, sheet dismissal and customization return.

Each parent has five palette identities. Joy retains red/yellow/blue/green/purple bodies; sadness and anger use the subtype colors explicitly selected by the user. Historical palette IDs remain stable, while visible names describe their actual colors. The UI uses the authored base recipe for each identity.

Touching an orb advances that orb to the next authored subtype in the same mood, skipping palette identities selected by other orbs. The touched orb grows to 120% of its base size and moves toward the touch over 1.6 seconds. Exactly one orb can retain this touch enlargement: repeated taps do not compound it, and touching another orb releases the previous enlargement. Unrelated orbs keep their own sizes and placements. Color morphs take 1.05 seconds; labels are suppressed until the actual destination colors are visible. The mood and its background remain unchanged. Manual mood/selection changes and reset clear the touch focus. Reduced motion settles immediately. Legacy size-swap helpers remain only for reference fixtures and tests.

Alternate soft/bold recipes remain internal reference data and are not exposed as three tap presets. Idle morphs retain the selected base palette; mood transitions suppress words until the new family is visible.

The starting controls are part of the authored mood and are applied to every layer, including the core. Initial load starts with joy's values, cycling replaces any custom color edits with the next mood's defaults, and reset restores the initial joy scene. Backgrounds are fixed colors and do not receive the orb transform.

| Mood | Hue rotation | Saturation | Lightness offset | Contrast |
| --- | ---: | ---: | ---: | ---: |
| Joy | 0° | 1.26 | −0.16 | 1.00 |
| Sadness | 0° | 1.20 | −0.10 | 0.78 |
| Anger | −38° | 1.00 | −0.21 | 0.70 |
| Fear | −40° | 1.00 | 0.00 | 1.00 |
| Peace | 0° | 1.00 | −0.10 | 1.00 |

Peace uses single-hue layers and a luminous core. Its mellow palette renders bright yellow rather than ochre after the approved transform. Joy's sunny palette renders an orange exterior and a bright, saturated lemon core. Joy's glad palette renders a pale vermilion exterior and a bright orange core after the same approved transform. The other joy cores remain sky blue, mint and pink-lilac.

Anger's first/default orb is angry / 화가 난, replacing the milder irritated as the base identity. Its background is deep indigo blue (#171b46). Its five authored identities retain their specified color relationships, with the approved −38° rotation applied. Anger's core size has been restored to the same 25–48% of the body radius as the other moods; support size is likewise 55–80%. Its support layer uses the same core color with a broad, soft falloff (softness .82–.95, alpha .82), and its core remains more opaque (alpha .98). Their centers align and move within .18 body radii. This strengthens the gradient without adding a new hue ring.

Sadness uses cold sky blue, pink with an ivory core, deep green with vivid red, black with a gray core, and orange with a subtle red middle and white core for heartsore, regretful, melancholic, resigned and wistful, on navy. Fear's defensive / 방어적인 and anxious / 불안한 retain their authored viridian/metallic-blue and violet/pink relationships before the approved −40° rotation.

A selection of 1–3 distinct identities has an explicit combination key (25 per parent). Normal app selections use the base profile; actual strong contrast selects the stronger authored interpretation. Individual sadness/anger/fear labels keep the exact subtype selected by the user even when the actual contrast is strong; compatibility gates still apply. Other orb labels follow the selected base palette. Tapping does not randomize the interpretation. Two authored peace combinations additionally use the dominant projected orb area; reordering the input alone cannot change the result.

No global weighted emotion score or global vocabulary sampling remains. Actual layer RGB after user adjustments is checked for compatibility in OKLCH: internal lightness contrast, background difference, chroma and pairwise hue/lightness separation. Strong contrast cannot return soothing or contemplative words. Large hue/lightness changes relative to the approved mood defaults, and washed-out anger/fear return no emotion and a visible rematching notice. These thresholds are editorial safeguards, not measured psychological laws.

Area and standalone HTML exports use the current animated scale, rather than the future target scale. Audio and shake mobility use the same current-size helper. Area is estimated from rendered radius and size. It does not measure clipped, blurred, occluded or overlapping visible pixel coverage. Multi-layer/background appearance is approximated for guards; visual review remains necessary.

## Validation

Run `node --test tests/mood-model.test.cjs`.
37 tests cover the approved default controls and mood switching, all 125 base selections over four seeds, 1,875 authored selections/variant assignments and 11,250 generated-color cases (two seeds, three contrast levels), finite bilingual vocabulary, hit-tested subtype cycling, exclusive non-compounding 20% focus, slow touch movement, transition label gating/current-color export, single-hue peace, exact sadness/anger subtype bindings, reference recipe meanings, order invariance, size-role swaps, rapid taps, reduced motion, role reuse on selection changes, exact radius exchanges with custom geometry, animated area/export consistency without palette mutation, empty/invalid inputs, custom-color incompatibility, and harsh original-generator regression. Renderer preservation is compared against all three Git refs. The 1,875 reference assignments match at the approved defaults in the recorded run. All 11,250 authored-recipe contrast samples match with the current defaults; separate harsh-color fixtures also verify rejection. Yellow core hues and common core/support size ranges are checked after the approved transform.

Run `node tests/build-review.cjs /absolute/output/path` to build a review with the real canvas renderer, pinned baselines, a strong-color regression, mood/background examples, all five joy/sadness/anger palettes, fear naming/palettes, touch-size before/after examples and pair/trio examples. It is a deterministic inspection fixture, not a separate implementation of the renderer.

Browser checks: desktop and 390px mobile; touch subtype cycling, exclusive 20% enlargement and slow movement, cycling moods, five orb labels, selection limits, language toggle, reset, image preview, video preview and exported standalone HTML. Physical device shake and audio quality are not validated by these automated checks. Browser preview video was 720×1280, approximately 29 seconds, readyState 4. PNG export is 1080×1920. Live canvas, image/video export and standalone HTML draw feeling text with fill only, without a text outline. Text ink is chosen from a small downsample of the painted surface beneath the text, so a white orb on a dark mood background gets dark lettering; live previews, image/video output and standalone HTML share the same helper. This chooses readable dark/light ink without changing emotion words. Standalone HTML retains the fixed background and parent/detail text; its fonts use existing external font URLs, so offline typography can differ.

## Basis and limitations

User-provided color references and direct visual feedback guide the recipes. Color associations are contextual and many-to-many, not diagnoses or guaranteed induced emotions. Primary background reading: [systematic review](https://link.springer.com/article/10.3758/s13423-024-02615-z), [PubMed record](https://pubmed.ncbi.nlm.nih.gov/39806242/). The tests establish consistency and exclusions, not universal psychological validity.

The Korean translation of threatened is 위협받는, replacing 위태로움을 느끼는. The English adjective remains threatened; risky describes risk rather than the selected fear experience.
