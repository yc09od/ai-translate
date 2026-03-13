feature：每一句话被ai api翻译且返回结果时，添加这个原文和译文进相应topic的翻译历史，同时实时的依次返回前台。
feature：前台应该监视websocket是否有译文返回，如果有，则添加在相应的mainpannel的展示栏里，
feature：前臺點擊topic的時候，歷史記錄應該展現在相应的mainpannel的展示栏里，

## still thinking, do not touch

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
