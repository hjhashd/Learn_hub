(function(window, undefined) {
    window.Asc.plugin.init = function() {
        console.log("AI Insert Plugin initialized");
        
        // 方案 A: 监听 BroadcastChannel (最强黑科技，绕过所有 Iframe 隔离)
        try {
            const channel = new BroadcastChannel('onlyoffice-ai-channel');
            channel.onmessage = function(event) {
                console.log("Plugin received via BroadcastChannel:", event.data);
                if (event.data && event.data.type === "ai-insert-text") {
                    insertText(event.data.text);
                }
            };
        } catch (e) {
            console.error("BroadcastChannel not supported", e);
        }

        // 方案 B: 传统的 postMessage 监听
        window.addEventListener("message", function(event) {
            if (event.data && event.data.type === "ai-insert-text") {
                console.log("Plugin received via postMessage:", event.data);
                insertText(event.data.text);
            }
        });

        // 核心插入函数
        function insertText(text) {
            try {
                // 社区版最稳妥的插入方式
                window.Asc.plugin.executeMethod("PasteText", [text]);
                console.log("Text inserted successfully");
            } catch (err) {
                console.error("Insert failed:", err);
            }
        }
    };

    window.Asc.plugin.button = function(id) {
        this.executeCommand("close", "");
    };
})(window, undefined);