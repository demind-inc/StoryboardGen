export const DEFAULT_CHARACTER_PROMPT = `
Use the attached images as strict, non-negotiable visual references.

Generate an illustration of the exact same recurring character, reused identically like a children’s book series or sticker set character.

### Character Lock (must not change)
* Young illustrated boy
* Round, soft face
* Light peach skin
* Big dark brown oval eyes
* Small rounded eyebrows
* Small rounded nose
* Childlike, slightly chubby proportions
* Short brown hair with one small messy flick on one side
* Wearing a long-sleeve orange shirt
* Identical face shape, eye size, hair silhouette, proportions, and simplicity as the reference images

### Illustration Style Lock (must not change)
* Soft whimsical cartoon style
* Rounded outlines only
* Flat warm pastel colors
* Very minimal shading
* Children’s book / educational illustration aesthetic

### Background (absolute, must follow)
* Transparent background
* No background color
* No gradients
* No shadows
* No surfaces
* Character and props appear as a clean cut-out sticker (but don't add white glow around the illustration) with alpha transparency

### Hard Restrictions
* Do NOT redesign or reinterpret the character
* Do NOT change the illustration style
* Do NOT add realism or semi-realism
* Keep everything simple, symbolic, and emotionally clear
`;

export const MODEL_NAME = "gemini-3-pro-image-preview";
export const CAPTION_MODEL_NAME =
  process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";
