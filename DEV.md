<!-- TOC -->

- [Code notes](#code-notes)
- [Inserting stuff to VE surface](#inserting-stuff-to-ve-surface)
	- [Find new types of data Nodes](#find-new-types-of-data-nodes)
		- [Official docs](#official-docs)
		- [Finding specific types](#finding-specific-types)
	- [Testing](#testing)
	- [Raw text](#raw-text)
	- [Paragraphs](#paragraphs)
	- [Headers](#headers)
	- [Templates](#templates)
	- [Links](#links)

<!-- /TOC -->

## Code notes

- `autoCorrectFromTo (from, to)` – main function to add rules.
  - The `from` is a trigger and can be:
    - a unique string,
	- a regular expression of the form `/foo(bar)/`,
	- or an array of data (VE nodes).
  - The `to` is a replacement and can be:
    - a raw string,
	- or an array of data (VE nodes).
- `AutoCorrectCommand (name, content)` – the low level class to insert content into VE surface.
  - The `name` is automatic (unique code name).
  - The `content` is `to` of `autoCorrectFromTo`.
- `ReSequence ()` – the low level class for adding regexp Sequence (a trigger text). This is why `from` can be regexp (aside from being a string or array).
- `class Helpers` – class for defining from/to.
- `veNuxAutocorrect` – main object.
- `mw.hook('userjs.veNuxAutocorrect').fire(veNuxAutocorrect, veNuxAutocorrect.helpers);` – crucial hook for adding custom replacements.

The crucial part where the insert actually happens is here:
```js
OO.inheritClass(AutoCorrectCommand, ve.ui.Command);
AutoCorrectCommand.prototype.execute = function (surface) {
	surface.getModel().getFragment()
		.insertContent(this.content)
		.collapseToEnd().select() // place the cursor after the content
	;
	appendUsageInfo();
	return true;
};
```

## Inserting stuff to VE surface

### Find new types of data Nodes

VE surface contains data nodes that are defined by more or less complex nodes.

#### Official docs

Some node types might be described here:  
https://www.mediawiki.org/wiki/VisualEditor/Gadgets  
(search for "type:")

Hooks:
https://www.mediawiki.org/wiki/VisualEditor/Hooks#New_target_hook

#### Finding specific types

To find specific types, it is probably best to analyze an almost empty page.

1. Open an empty page: https://pl.wikipedia.org/w/index.php?title=Wikipedysta:Nux/vedit&veaction=edit

2. Add the elements you want to inspect.

3. Analyze the current document data:
```js
var veSurface = ve.init.target.getSurface();
console.log(veSurface.getModel().getFragment()?.document?.data?.data)
```

### Testing insert to VE

```js
var content = //.to;
var veSurface = ve.init.target.getSurface();
veSurface.getModel().getFragment()
	.insertContent(content)
	.collapseToEnd().select() // place the cursor after the content
;
```

### Raw text

Inserting text is simple:
```js
nac.add({ from:'(c)', to:'©' });
nac.add({ from:'(c+)', to:'Copyright ©' });

// but this will insert text too (not the actual tag as a tag)
// so this automatically adds <nowiki>
nac.add({ from:'<rs', to:'<references />' });
```

### Paragraphs

Empty paragraph:
```js
var content = [
	{type: 'paragraph'},
	{type: '/paragraph'},
]
```
With text:
```js
var content = [
	{type: 'paragraph'},
	...text.split(''),
	{type: '/paragraph'},
]
```

Yes, text is added as an array of letters. For some weird reason this works better.

### Headers
```js
var content = [
	{type: 'heading', attributes: {level: 2}},
	...text.split(''),
	{type: '/heading'},
]
```

### Templates
```js
var template = {
	target: {
		href: 'Template:TEMPLATENAME',
		wt: 'TEMPLATENAME'
	},
	params: {
		ParamName: { wt: 'some value' },
		ParamName2: { wt: 'other value' },
	},
};
var content = [
	{ type: 'mwTransclusionInline',	attributes: {
		mw: {
			parts: [ { template: template } ]
		}
	} },
	{ type: '/mwTransclusionInline' },
]
```

Minimal template data example:
```js
var template = {
	target: {
		href: 'Szablon:Przypisy',
		wt: 'Przypisy',
	},
}
```

The type can be:
`tplType = block ? 'mwTransclusionBlock' : 'mwTransclusionInline';`

But not sure what it does 🙃...

### Links

```js
var content = {
	type: 'link/mwExternal',
	attributes: { href: 'https://www.example.com' }
}
```