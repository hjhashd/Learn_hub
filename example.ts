// d:\react_code\LearnHub\example.ts
// OnlyOffice AI 自动插入核心逻辑实现参考

import React, { useState, useRef } from 'react';

// --- 1. 核心状态与引用 ---
/*
  const [aiText, setAiText] = useState('');           // AI 生成的文本内容
  const [isGenerating, setIsGenerating] = useState(false); // 生成状态
  const editorInstanceRef = useRef<any>(null);        // OnlyOffice 编辑器实例引用
*/

// --- 2. AI 文本生成逻辑 ---
/**
 * 模拟 AI 生成文本过程
 */
const handleAiGenerate = (setAiText: Function, setIsGenerating: Function) => {
  setIsGenerating(true);
  setAiText('');
  
  setTimeout(() => {
    const generatedText = "AI 自动生成的内容示例：\nOnlyOffice 是一款强大的开源办公套件。通过其提供的 API 和插件系统，我们可以实现复杂的文档自动化操作。本次实现的 AI 自动插入功能，利用了 BroadcastChannel 跨域通信黑科技，完美解决了社区版在 Iframe 隔离环境下的 API 调用限制。";
    setAiText(generatedText);
    setIsGenerating(false);
  }, 2000);
};

// --- 3. 核心插入逻辑 (重点) ---
/**
 * 将 AI 生成的内容插入到 OnlyOffice 编辑器当前光标位置
 * 兼容性方案：高级 API (callCommand) + 社区版黑科技 (BroadcastChannel 插件通信)
 */
const handleApplyAndInsert = async (editorInstance: any, text: string, fileName: string) => {
  if (!editorInstance || !text) return;

  // 检查是否为 Word 文档，因为 Api.GetDocument() 仅适用于 Word
  const isWord = fileName.endsWith('.doc') || fileName.endsWith('.docx');
  if (!isWord) {
    alert('AI 插入功能目前仅支持 Word 文档');
    return;
  }

  try {
    // 方案 A: 尝试直接使用 callCommand (OnlyOffice 企业版/开发者版/本地开发模式)
    // 这是最直接的方式，可以在外部直接执行文档命令
    const callCommand = editorInstance.callCommand || (editorInstance as any).connector?.callCommand;
    
    if (typeof callCommand === 'function') {
      console.log('检测到高级 API，正在直接插入...');
      const command = `
        var oDocument = Api.GetDocument();
        var oParagraph = Api.CreateParagraph();
        oParagraph.AddText(${JSON.stringify(text)});
        oDocument.InsertContent([oParagraph], true);
      `;
      callCommand.call(editorInstance, command);
      return;
    }

    // 方案 B: 社区版黑科技 (跨域/隔离环境下的通信)
    // 社区版在非同源或 Docker 部署时，外部页面无法直接调用 callCommand
    // 此时通过 BroadcastChannel 与已经在编辑器内部加载的插件进行对话
    console.warn('高级 API 不可用，尝试通过 BroadcastChannel 与内部插件通信...');
    
    const channel = new BroadcastChannel('onlyoffice-ai-channel');
    channel.postMessage({
      type: "ai-insert-text",
      text: text
    });
    
    // 显示一个简单的提示
    console.log('指令已发送至插件通道');
    
    setTimeout(() => {
      channel.close(); // 任务完成关闭通道
    }, 1000);

  } catch (e) {
    console.error('自动插入失败:', e);
    
    // 兜底方案：引导用户手动粘贴
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('由于环境限制无法自动插入，已将内容复制到剪贴板，请在文档中手动粘贴。');
  }
};

// --- 4. OnlyOffice 初始化配置 ---
/**
 * 初始化时需要配置插件加载
 */
const getEditorConfig = (pluginConfigUrl: string, spellCheck: boolean) => {
  return {
    editorConfig: {
      lang: "zh-CN",
      customization: {
        features: {
          spellcheck: spellCheck // 控制拼写检查（红色波浪线）
        }
      },
      plugins: {
        // 插件 GUID 必须与 config.json 中一致
        autostart: ["asc.{6B7A6A6A-7A6A-4A6A-8A6A-7A6A6A6A6A6A}"],
        pluginsData: [pluginConfigUrl] // 插件 config.json 的访问地址
      }
    }
  };
};

// --- 5. 插件端实现 (public/plugins/ai-insert/...) ---

/* 
  文件 A: config.json
  {
      "name": "AI Insert",
      "guid": "asc.{6B7A6A6A-7A6A-4A6A-8A6A-7A6A6A6A6A6A}",
      "variations": [
          {
              "url": "index.html",
              "isSystem": true, // 系统插件，后台运行
              "isVisual": false, // 无需 UI 界面
              "isInsideMode": true, // 运行在编辑器内部
              "editorType": ["word"]
          }
      ]
  }

  文件 B: code.js (插件核心)
  (function(window, undefined) {
      window.Asc.plugin.init = function() {
          // 监听外部发来的广播消息
          const channel = new BroadcastChannel('onlyoffice-ai-channel');
          channel.onmessage = function(event) {
              if (event.data && event.data.type === "ai-insert-text") {
                  // 插件内部拥有完整的 executeMethod 权限
                  window.Asc.plugin.executeMethod("PasteText", [event.data.text]);
              }
          };
      };
  })(window, undefined);
*/

// --- 6. 网络安全配置 (next.config.js) ---
/*
  async headers() {
    return [
      {
        // 必须允许跨域，否则 OnlyOffice 无法从另一个端口/域名加载插件
        source: "/plugins/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" }
        ],
      },
    ];
  }
*/
