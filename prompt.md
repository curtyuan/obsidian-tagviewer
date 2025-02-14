# Current Status
basic usage of tagviewer is using code block like this
````
```tagbiew
```
````
for createing a tagview zone.

current plugin can correctly rendered the tag table with requirement below:

1. list tag content (text follows with tag) and exclude tag.
2. list line number and provide link to target line.
3. navigate to target line by click the line link, and align the viewport to 1/3 height from top.

## still lack of

1. when navigate to target tag. the target line should shine for 2 second for user eaiser to locate it.

# Current task
1. Please refer to "# Reference" and modify the code to capable of shining by navigate. and remember don't kill implemented code.
2. Please review readme.md and eliminate these not 

## dealing of error
whenever encountered with error. we follow the steps to deal with it.
1. attempt to figuring out what happen behind the error.
2. search for obsidian documentation or target component documentation. for knowing relevant used api or function. especially for limitation and usage.
3. with information equiped. start planning how to resolve this error and still keep a good practice.
4. provide solution and reason.


# Reference


根據 Obsidian 插件開發需求和 CodeMirror 的特性，實現視窗定位與行高亮可採用以下技術方案：

## 核心功能實現步驟
1. **視窗定位功能**
```typescript
import { EditorView } from "@codemirror/view"

function scrollToLine(editor: EditorView, lineNumber: number) {
  const line = editor.state.doc.line(lineNumber)
  editor.dispatch({
    effects: EditorView.scrollIntoView(line.from, { y: "center" })
  })
}
```
- 使用 `scrollIntoView` 可確保目標行自動居中顯示[3][11]
- 參數 `y: "center"` 實現垂直居中對齊[11]

2. **動態高亮效果**
```css
/* 添加自定義 CSS 類 */
.cm-temp-highlight {
  background-color: #ffeb3b55;
  animation: pulse 2s ease-out;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255,235,59,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255,235,59,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,235,59,0); }
}
```

3. **裝飾器管理系統**
```typescript
import { Decoration, EditorView } from "@codemirror/view"
import { StateField, StateEffect } from "@codemirror/state"

const highlightEffect = StateEffect.define<{ from: number, to: number }>()
const highlightField = StateField.define<DecorationSet>({
  create: () => Decoration.none(),
  update: (deco, tr) => {
    deco = deco.map(tr.changes)
    for (let e of tr.effects) {
      if (e.is(highlightEffect)) {
        const mark = Decoration.mark({
          class: "cm-temp-highlight"
        })
        deco = deco.update({
          add: [mark.range(e.value.from, e.value.to)]
        })
      }
    }
    return deco
  },
  provide: f => EditorView.decorations.from(f)
})
```

## 完整功能整合
```typescript
export function highlightAndScroll(editor: EditorView, lineNumber: number) {
  const line = editor.state.doc.line(lineNumber)
  
  // 執行視窗滾動
  scrollToLine(editor, lineNumber)

  // 添加臨時高亮
  editor.dispatch({
    effects: highlightEffect.of({
      from: line.from,
      to: line.to
    })
  })

  // 2 秒後移除高亮
  setTimeout(() => {
    editor.dispatch({
      effects: highlightEffect.of({
        from: line.from,
        to: line.to
      }).map(() => []) // 空數組表示移除效果
    })
  }, 2000)
}
```

## 進階功能建議
1. **多層次動態效果控制**
```typescript
const animationLayers = [
  { className: 'cm-temp-layer1', delay: 0 },
  { className: 'cm-temp-layer2', delay: 300 },
  { className: 'cm-temp-layer3', delay: 600 }
]
```

2. **效能優化措施**
- 使用 `requestAnimationFrame` 優化動畫流暢度
- 實現裝飾器緩存池避免頻繁創建對象
- 添加防抖機制防止快速連續觸發

## 注意事項
1. **版本兼容性**
- 需同時支持 CodeMirror 5 (傳統編輯器) 和 CodeMirror 6 (即時預覽)[4][14]
2. **主題適配**
```css
/* 自適應主題示例 */
.cm-temp-highlight {
  background-color: hsl(var(--accent-h), 70%, 40%);
  opacity: 0.3;
}
```

此方案結合 CodeMirror 的狀態管理系統與 CSS 動畫技術，能在保證效能的前提下實現流暢的視覺效果，同時通過 Obsidian 的插件 API 保持與編輯器核心功能的兼容性[2][8][11]。實際開發時建議搭配 Obsidian 的熱重載功能進行即時調試。
