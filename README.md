# js-gallery-box - simple jQuery Gallery Box

## Description

A simple javascript gallery lightbox.
Can display links to images or optionally html content (iframe).

## Browser support

Internet Explorer 8 and (almost) anything newer ;)

## Options

Name        | Type       | Default    | Description
:---------- | :--------- | :--------- | :-----------
icons       | {} | {prev: '&amp;lt;', next: '&amp;gt;', close: '&amp;times;'} | icons or text on functional buttons
mark        | string     | null       | custom gallery box element ID
item        | string     | a          | element|class linking to content
iframe      | string     | null       | class marking for non image content. Will be displayed in frame
opener      | string     | null       | custom element for opening gallery
arrows      | bool       | true       | display arrows and allows paging between items
pager       | bool       | false      | show current page / total count of items
modal       | bool       | true       | show gallery modal
shrink      | bool       | true       | scale down large images to fit the screen size
swipe       | bool       | true       | enable touch swipe
duration    | int        | 250        | time (ms)

## Usage

```javascript
$("#target").galleryBox({});
```