# js-gallery-box - simple jQuery Gallery Box

## Description

Simple javascript gallery

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
shrink      | bool       | true       | scale down large images to fit the screen size
modal       | bool       | true       | show gallery modal
duration    | int        | 250        | time (ms)