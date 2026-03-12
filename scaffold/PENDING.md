## still thinking, do not touch
gemini 强调 system_instruction 无感情的翻译协议
feature：后台添加pre-prompt列表文件。添加pre-prompt告诉ai api，基于当前的语言，返回这段音频的原文文字和翻译成中文或者英文的文字。只返回原文和译文，格式为json，{o：原文，t：译文}。
feature：原本保存每段句子为文件，现在添加新功能，不仅仅保存句子为文件，同时异步的发送这段二进制音频给ai api。使用我们的pre-prompt要求ai api翻译。注意，保存句子和发送翻译请求应该同时进行。所有进程可以不等待文件保存。
feature：每一句话被ai api翻译且返回结果时，添加这个原文和译文进相应topic的翻译历史，同时实时的依次返回前台。
feature：前台应该监视websocket是否有译文返回，如果有，则添加在相应的mainpannel的展示栏里，

当api断句之后，应该把这一段buffer送给ai api翻译。
我们需要一个预prompt，只输出翻译之后的句子。

bug，网页明明开着，但是token到期，refresh token没有fresh成功

-- 读取流
我们需要一个预prompt，只输出翻译之后的句子。

当api得到ai api返回的译文，我们需要第一，保存这个结果，同时也发送这个结果给前台。
前台要渲染这个结果

本地向量化FastEmbed
