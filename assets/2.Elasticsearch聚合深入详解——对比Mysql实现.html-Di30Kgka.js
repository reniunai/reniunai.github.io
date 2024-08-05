import{_ as s}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as a,d as e,a as n,e as l,o}from"./app-zamys2Ga.js";const t={},p=n("p",null,"go-简单使用elasticsearch",-1),c=l(`<p>go-es客户端：github.com/elastic/go-elasticsearch/v8</p><p>执行以下命令安装v8版本的 go 客户端。</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="background-color:#2e3440ff;color:#d8dee9ff;"><pre class="shiki nord vp-code"><code><span class="line"><span style="color:#88C0D0;">go</span><span style="color:#A3BE8C;"> get</span><span style="color:#A3BE8C;"> github.com/elastic/go-elasticsearch/v8@latest</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>导入依赖。</p><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="background-color:#2e3440ff;color:#d8dee9ff;"><pre class="shiki nord vp-code"><code><span class="line"><span style="color:#81A1C1;">import</span><span style="color:#ECEFF4;"> &quot;</span><span style="color:#A3BE8C;">github.com/elastic/go-elasticsearch/v8</span><span style="color:#ECEFF4;">&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>可以根据实际需求导入不同的客户端版本，也支持在一个项目中导入不同的客户端版本。</p><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="background-color:#2e3440ff;color:#d8dee9ff;"><pre class="shiki nord vp-code"><code><span class="line"><span style="color:#81A1C1;">import</span><span style="color:#ECEFF4;"> (</span></span>
<span class="line"><span style="color:#D8DEE9;">  elasticsearch7</span><span style="color:#ECEFF4;"> &quot;</span><span style="color:#A3BE8C;">github.com/elastic/go-elasticsearch/v7</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#D8DEE9;">  elasticsearch8</span><span style="color:#ECEFF4;"> &quot;</span><span style="color:#A3BE8C;">github.com/elastic/go-elasticsearch/v8</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#ECEFF4;">)</span></span>
<span class="line"></span>
<span class="line"><span style="color:#616E88;">// ...</span></span>
<span class="line"><span style="color:#D8DEE9;">es7</span><span style="color:#ECEFF4;">,</span><span style="color:#D8DEE9;"> _</span><span style="color:#81A1C1;"> :=</span><span style="color:#D8DEE9;"> elasticsearch7</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">NewDefaultClient</span><span style="color:#ECEFF4;">()</span></span>
<span class="line"><span style="color:#D8DEE9;">es8</span><span style="color:#ECEFF4;">,</span><span style="color:#D8DEE9;"> _</span><span style="color:#81A1C1;"> :=</span><span style="color:#D8DEE9;"> elasticsearch8</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">NewDefaultClient</span><span style="color:#ECEFF4;">()</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="连接-es" tabindex="-1"><a class="header-anchor" href="#连接-es"><span>连接 ES</span></a></h2><p>指定要连接 ES 的相关配置，并创建客户端连接。</p><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="background-color:#2e3440ff;color:#d8dee9ff;"><pre class="shiki nord vp-code"><code><span class="line"><span style="color:#616E88;">// ES 配置</span></span>
<span class="line"><span style="color:#D8DEE9;">cfg</span><span style="color:#81A1C1;"> :=</span><span style="color:#D8DEE9FF;"> elasticsearch</span><span style="color:#ECEFF4;">.</span><span style="color:#D8DEE9FF;">Config</span><span style="color:#ECEFF4;">{</span></span>
<span class="line"><span style="color:#D8DEE9;">        Addresses</span><span style="color:#ECEFF4;">:</span><span style="color:#ECEFF4;"> []</span><span style="color:#81A1C1;">string</span><span style="color:#ECEFF4;">{</span></span>
<span class="line"><span style="color:#ECEFF4;">                &quot;</span><span style="color:#A3BE8C;">http://localhost:9200</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#ECEFF4;">,</span></span>
<span class="line"><span style="color:#ECEFF4;">        },</span></span>
<span class="line"><span style="color:#ECEFF4;">}</span></span>
<span class="line"></span>
<span class="line"><span style="color:#616E88;">// 创建客户端连接</span></span>
<span class="line"><span style="color:#D8DEE9;">client</span><span style="color:#ECEFF4;">,</span><span style="color:#D8DEE9;"> err</span><span style="color:#81A1C1;"> :=</span><span style="color:#D8DEE9;"> elasticsearch</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">NewTypedClient</span><span style="color:#ECEFF4;">(</span><span style="color:#D8DEE9;">cfg</span><span style="color:#ECEFF4;">)</span></span>
<span class="line"><span style="color:#81A1C1;">if</span><span style="color:#D8DEE9;"> err</span><span style="color:#81A1C1;"> !=</span><span style="color:#81A1C1;"> nil</span><span style="color:#ECEFF4;"> {</span></span>
<span class="line"><span style="color:#D8DEE9;">        fmt</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">Printf</span><span style="color:#ECEFF4;">(</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#A3BE8C;">elasticsearch.NewTypedClient failed, err:</span><span style="color:#EBCB8B;">%v\\n</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#ECEFF4;">,</span><span style="color:#D8DEE9;"> err</span><span style="color:#ECEFF4;">)</span></span>
<span class="line"><span style="color:#81A1C1;">        return</span><span style="color:#ECEFF4;">}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>创建索引：</p><div class="language-go line-numbers-mode" data-highlighter="shiki" data-ext="go" data-title="go" style="background-color:#2e3440ff;color:#d8dee9ff;"><pre class="shiki nord vp-code"><code><span class="line"><span style="color:#616E88;">// createIndex 创建索引</span></span>
<span class="line"><span style="color:#81A1C1;">func</span><span style="color:#88C0D0;"> createIndex</span><span style="color:#ECEFF4;">(</span><span style="color:#D8DEE9;">client</span><span style="color:#81A1C1;"> *</span><span style="color:#D8DEE9FF;">elasticsearch</span><span style="color:#ECEFF4;">.</span><span style="color:#D8DEE9FF;">TypedClient</span><span style="color:#ECEFF4;">)</span><span style="color:#ECEFF4;"> {</span></span>
<span class="line"><span style="color:#D8DEE9;">    resp</span><span style="color:#ECEFF4;">,</span><span style="color:#D8DEE9;"> err</span><span style="color:#81A1C1;"> :=</span><span style="color:#D8DEE9;"> client</span><span style="color:#ECEFF4;">.</span><span style="color:#D8DEE9;">Indices</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">Create</span><span style="color:#ECEFF4;">(</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#A3BE8C;">my-review-1</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#ECEFF4;">).</span><span style="color:#88C0D0;">Do</span><span style="color:#ECEFF4;">(</span><span style="color:#D8DEE9;">context</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">Background</span><span style="color:#ECEFF4;">())</span></span>
<span class="line"><span style="color:#81A1C1;">    if</span><span style="color:#D8DEE9;"> err</span><span style="color:#81A1C1;"> !=</span><span style="color:#81A1C1;"> nil</span><span style="color:#ECEFF4;"> {</span></span>
<span class="line"><span style="color:#D8DEE9;">        fmt</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">Printf</span><span style="color:#ECEFF4;">(</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#A3BE8C;">create index failed, err:</span><span style="color:#EBCB8B;">%v\\n</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#ECEFF4;">,</span><span style="color:#D8DEE9;"> err</span><span style="color:#ECEFF4;">)</span></span>
<span class="line"><span style="color:#81A1C1;">        return</span></span>
<span class="line"><span style="color:#ECEFF4;">    }</span></span>
<span class="line"><span style="color:#D8DEE9;">    fmt</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">Printf</span><span style="color:#ECEFF4;">(</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#A3BE8C;">index:</span><span style="color:#EBCB8B;">%#v\\n</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#ECEFF4;">,</span><span style="color:#D8DEE9;"> resp</span><span style="color:#ECEFF4;">.</span><span style="color:#D8DEE9;">Index</span><span style="color:#ECEFF4;">)</span></span>
<span class="line"><span style="color:#ECEFF4;">}</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,12);function r(i,E){return o(),a("div",null,[p,e(" more "),c])}const F=s(t,[["render",r],["__file","2.Elasticsearch聚合深入详解——对比Mysql实现.html.vue"]]),m=JSON.parse('{"path":"/note/es/2.Elasticsearch%E8%81%9A%E5%90%88%E6%B7%B1%E5%85%A5%E8%AF%A6%E8%A7%A3%E2%80%94%E2%80%94%E5%AF%B9%E6%AF%94Mysql%E5%AE%9E%E7%8E%B0.html","title":"go-简单使用elasticsearch","lang":"zh-CN","frontmatter":{"title":"go-简单使用elasticsearch","cover":"/assets/images/cover1.jpg","icon":"file","order":3,"author":"HotMilk","date":"2024-07-15T00:00:00.000Z","category":["Go"],"tag":["elasticsearch"],"description":"go-简单使用elasticsearch","head":[["meta",{"property":"og:url","content":"https://reniunai.github.io/note/es/2.Elasticsearch%E8%81%9A%E5%90%88%E6%B7%B1%E5%85%A5%E8%AF%A6%E8%A7%A3%E2%80%94%E2%80%94%E5%AF%B9%E6%AF%94Mysql%E5%AE%9E%E7%8E%B0.html"}],["meta",{"property":"og:site_name","content":"热牛奶"}],["meta",{"property":"og:title","content":"go-简单使用elasticsearch"}],["meta",{"property":"og:description","content":"go-简单使用elasticsearch"}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://reniunai.github.io/assets/images/cover1.jpg"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2024-08-05T08:48:07.000Z"}],["meta",{"name":"twitter:card","content":"summary_large_image"}],["meta",{"name":"twitter:image:src","content":"https://reniunai.github.io/assets/images/cover1.jpg"}],["meta",{"name":"twitter:image:alt","content":"go-简单使用elasticsearch"}],["meta",{"property":"article:author","content":"HotMilk"}],["meta",{"property":"article:tag","content":"elasticsearch"}],["meta",{"property":"article:published_time","content":"2024-07-15T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2024-08-05T08:48:07.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"go-简单使用elasticsearch\\",\\"image\\":[\\"https://reniunai.github.io/assets/images/cover1.jpg\\"],\\"datePublished\\":\\"2024-07-15T00:00:00.000Z\\",\\"dateModified\\":\\"2024-08-05T08:48:07.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"HotMilk\\"}]}"]]},"headers":[{"level":2,"title":"连接 ES","slug":"连接-es","link":"#连接-es","children":[]}],"git":{"createdTime":1722847687000,"updatedTime":1722847687000,"contributors":[{"name":"reniunai","email":"2843768@qq.com","commits":1}]},"readingTime":{"minutes":1.13,"words":339},"filePathRelative":"note/es/2.Elasticsearch聚合深入详解——对比Mysql实现.md","localizedDate":"2024年7月15日","excerpt":"<p>go-简单使用elasticsearch</p>\\n","autoDesc":true}');export{F as comp,m as data};
