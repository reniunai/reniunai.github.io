import{_ as n}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as a,d as l,a as s,f as e,e as p,o}from"./app-zamys2Ga.js";const t={},i=s("p",null,[s("code",null,"more"),e(" 注释之前的内容被视为文章摘要。")],-1),c=p(`<h1 id="redis缓存穿透-布隆过滤器" tabindex="-1"><a class="header-anchor" href="#redis缓存穿透-布隆过滤器"><span>Redis缓存穿透-布隆过滤器</span></a></h1><h2 id="缓存穿透" tabindex="-1"><a class="header-anchor" href="#缓存穿透"><span>缓存穿透</span></a></h2><p>我举个蘑菇博客中的案例来说，我现在有一个博客详情页，然后博客详情页中的内容假设是存储在Redis中的，然后通过博客的Uid进行获取，正常的情况是：用户进入博客详情页，然后通过uid获取redis中缓存的文章详情，如果有内容就直接访问，如果不存在内容，那么需要访问数据库，然后从数据库中查询我们的博客详情后，然后在存储到redis中，最后在把数据返回给我们的页面。</p><p>但是可能存在一些非法用户，他可能会模拟出很多不存在的key，然后通过该key去请求后台，首先redis的缓存没有命中，那么就去请求数据库，最后数据库没有查询出该内容，这样很多个非法的请求直接打在数据库中，可能会导致数据库直接宕机，无法对外提供服务。这就是我们所说的缓存穿透问题</p><h2 id="简单的解决方法" tabindex="-1"><a class="header-anchor" href="#简单的解决方法"><span>简单的解决方法</span></a></h2><p>针对这个情况，我们有一种简单的解决方法就是，在数据库没有查询该条数据的时候，我们让该key缓存一个 空数据，这样用户再次以该key请求后台的时候，会直接返回null，避免了再次请求数据库。</p><h2 id="布隆过滤器" tabindex="-1"><a class="header-anchor" href="#布隆过滤器"><span>布隆过滤器</span></a></h2><h3 id="什么是布隆过滤器" tabindex="-1"><a class="header-anchor" href="#什么是布隆过滤器"><span>什么是布隆过滤器</span></a></h3><p>布隆过滤器的巨大作用 ，就是能够迅速判断一个元素是否存在一个集合中。因此次他有如下几个使用场景</p><ul><li>网站爬虫对URL的去重，避免爬取相同的URL</li><li>反垃圾邮件，从数十亿个垃圾邮件列表中判断某邮箱是否是垃圾邮件（同理，垃圾短信）</li><li>缓存穿透，将所有可能的数据缓存放到布隆过滤器中，当黑客访问不存在的缓存时，迅速返回避免缓存以及DB挂掉。</li></ul><h3 id="原理" tabindex="-1"><a class="header-anchor" href="#原理"><span>原理</span></a></h3><p>布隆过滤器其内部维护了一个全为0的bit数组，需要说明的是，布隆过滤器有一个误判的概念，误判率越低，则数组越长，所占空间越大。误判率越高则数组越小，所占的空间多少。</p><p>假设，根据误判率，我们生成一个10位的bit数组，以及2个hash函数 f1 和 f2，如下图所示：生成的数组的位数 和 hash函数的数量，我们不用去关心如何生成的，这是有数学论文进行验证。</p><figure><img src="https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151815101.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure><p>然后我们输入一个集合，集合中包含 N1 和 N2，我们通过计算 f1(N1) = 2，f2(N1) = 5，则将数组下标为2 和下标为5的位置设置成1，就得到了下图</p><figure><img src="https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151815065.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure><p>同理，我们再次进行计算 N2的值， f1(N2) = 3，f2(N2) = 6。得到如下所示的图</p><figure><img src="https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151815085.png" alt="img" tabindex="0" loading="lazy"><figcaption>img</figcaption></figure><p>这个时候，假设我们有第三个数N3过来了，我们需要判断N3是否在集合 [N1,N2]中，我们需要做的操作就是，使用f1 和 f2 计算出数组中的地址</p><ul><li>若值恰巧都位于上图的红色位置，我们认为 N3在集合 [N1,N2] 中</li><li>若值有一个不位于上图的红色部分，我们认为N3不在集合[N1,N2] 中</li></ul><p>这就是布隆过滤器的计算原理</p><h3 id="使用" tabindex="-1"><a class="header-anchor" href="#使用"><span>使用</span></a></h3><p>在java中使用布隆过滤器，我们需要首先引入依赖，布隆过滤器拥有Google提供的一个开箱即用的组件，来帮助我们实现布隆过滤器，其实布隆过滤器的核心思想其实并不难，难的是在于如何设计随机映射函数，到底映射几次，二进制向量设置多少比较合适。</p><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" data-title="java" style="background-color:#2e3440ff;color:#d8dee9ff;"><pre class="shiki nord vp-code"><code><span class="line"><span style="color:#81A1C1;">&lt;</span><span style="color:#D8DEE9FF;">dependencies</span><span style="color:#81A1C1;">&gt;</span></span>
<span class="line"><span style="color:#81A1C1;">    &lt;</span><span style="color:#D8DEE9FF;">dependency</span><span style="color:#81A1C1;">&gt;</span></span>
<span class="line"><span style="color:#81A1C1;">        &lt;</span><span style="color:#D8DEE9FF;">groupId</span><span style="color:#81A1C1;">&gt;</span><span style="color:#D8DEE9;">com</span><span style="color:#ECEFF4;">.</span><span style="color:#D8DEE9;">google</span><span style="color:#ECEFF4;">.</span><span style="color:#D8DEE9;">guava</span><span style="color:#81A1C1;">&lt;/</span><span style="color:#D8DEE9FF;">groupId</span><span style="color:#81A1C1;">&gt;</span><span style="color:#D8DEE9FF;">     </span></span>
<span class="line"><span style="color:#81A1C1;">        &lt;</span><span style="color:#D8DEE9FF;">artifactId</span><span style="color:#81A1C1;">&gt;</span><span style="color:#D8DEE9FF;">guava</span><span style="color:#81A1C1;">&lt;/</span><span style="color:#D8DEE9FF;">artifactId</span><span style="color:#81A1C1;">&gt;</span><span style="color:#D8DEE9FF;">      </span></span>
<span class="line"><span style="color:#81A1C1;">        &lt;</span><span style="color:#D8DEE9FF;">version</span><span style="color:#81A1C1;">&gt;</span><span style="color:#B48EAD;">22.0</span><span style="color:#81A1C1;">&lt;/</span><span style="color:#D8DEE9FF;">version</span><span style="color:#81A1C1;">&gt;</span></span>
<span class="line"><span style="color:#81A1C1;">    &lt;/</span><span style="color:#D8DEE9FF;">dependency</span><span style="color:#81A1C1;">&gt;</span></span>
<span class="line"><span style="color:#81A1C1;">&lt;/</span><span style="color:#D8DEE9FF;">dependencies</span><span style="color:#81A1C1;">&gt;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>然后我们编写代码，测试某元素是否存在于百万元素集合中</p><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" data-title="java" style="background-color:#2e3440ff;color:#d8dee9ff;"><pre class="shiki nord vp-code"><code><span class="line"><span style="color:#81A1C1;">    private</span><span style="color:#81A1C1;"> static</span><span style="color:#81A1C1;"> int</span><span style="color:#D8DEE9;"> size</span><span style="color:#81A1C1;"> =</span><span style="color:#B48EAD;"> 1000000</span><span style="color:#81A1C1;">;</span><span style="color:#616E88;">//预计要插入多少数据</span></span>
<span class="line"></span>
<span class="line"><span style="color:#81A1C1;">    private</span><span style="color:#81A1C1;"> static</span><span style="color:#81A1C1;"> double</span><span style="color:#D8DEE9;"> fpp</span><span style="color:#81A1C1;"> =</span><span style="color:#B48EAD;"> 0.01</span><span style="color:#81A1C1;">;</span><span style="color:#616E88;">//期望的误判率</span></span>
<span class="line"></span>
<span class="line"><span style="color:#81A1C1;">    private</span><span style="color:#81A1C1;"> static</span><span style="color:#8FBCBB;"> BloomFilter</span><span style="color:#ECEFF4;">&lt;</span><span style="color:#8FBCBB;">Integer</span><span style="color:#ECEFF4;">&gt;</span><span style="color:#D8DEE9;"> bloomFilter</span><span style="color:#81A1C1;"> =</span><span style="color:#D8DEE9;"> BloomFilter</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">create</span><span style="color:#ECEFF4;">(</span><span style="color:#D8DEE9;">Funnels</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">integerFunnel</span><span style="color:#ECEFF4;">(),</span><span style="color:#D8DEE9FF;"> size</span><span style="color:#ECEFF4;">,</span><span style="color:#D8DEE9FF;"> fpp</span><span style="color:#ECEFF4;">)</span><span style="color:#81A1C1;">;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#81A1C1;">    public</span><span style="color:#81A1C1;"> static</span><span style="color:#81A1C1;"> void</span><span style="color:#88C0D0;"> main</span><span style="color:#ECEFF4;">(</span><span style="color:#8FBCBB;">String</span><span style="color:#ECEFF4;">[]</span><span style="color:#D8DEE9FF;"> args</span><span style="color:#ECEFF4;">)</span><span style="color:#ECEFF4;"> {</span></span>
<span class="line"><span style="color:#616E88;">        //插入数据</span></span>
<span class="line"><span style="color:#81A1C1;">        for</span><span style="color:#ECEFF4;"> (</span><span style="color:#81A1C1;">int</span><span style="color:#D8DEE9;"> i</span><span style="color:#81A1C1;"> =</span><span style="color:#B48EAD;"> 0</span><span style="color:#81A1C1;">;</span><span style="color:#D8DEE9FF;"> i </span><span style="color:#81A1C1;">&lt;</span><span style="color:#B48EAD;"> 1000000</span><span style="color:#81A1C1;">;</span><span style="color:#D8DEE9FF;"> i</span><span style="color:#81A1C1;">++</span><span style="color:#ECEFF4;">)</span><span style="color:#ECEFF4;"> {</span></span>
<span class="line"><span style="color:#D8DEE9;">            bloomFilter</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">put</span><span style="color:#ECEFF4;">(</span><span style="color:#D8DEE9FF;">i</span><span style="color:#ECEFF4;">)</span><span style="color:#81A1C1;">;</span></span>
<span class="line"><span style="color:#ECEFF4;">        }</span></span>
<span class="line"><span style="color:#81A1C1;">        int</span><span style="color:#D8DEE9;"> count</span><span style="color:#81A1C1;"> =</span><span style="color:#B48EAD;"> 0</span><span style="color:#81A1C1;">;</span></span>
<span class="line"><span style="color:#81A1C1;">        for</span><span style="color:#ECEFF4;"> (</span><span style="color:#81A1C1;">int</span><span style="color:#D8DEE9;"> i</span><span style="color:#81A1C1;"> =</span><span style="color:#B48EAD;"> 1000000</span><span style="color:#81A1C1;">;</span><span style="color:#D8DEE9FF;"> i </span><span style="color:#81A1C1;">&lt;</span><span style="color:#B48EAD;"> 2000000</span><span style="color:#81A1C1;">;</span><span style="color:#D8DEE9FF;"> i</span><span style="color:#81A1C1;">++</span><span style="color:#ECEFF4;">)</span><span style="color:#ECEFF4;"> {</span></span>
<span class="line"><span style="color:#81A1C1;">            if</span><span style="color:#ECEFF4;"> (</span><span style="color:#D8DEE9;">bloomFilter</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">mightContain</span><span style="color:#ECEFF4;">(</span><span style="color:#D8DEE9FF;">i</span><span style="color:#ECEFF4;">))</span><span style="color:#ECEFF4;"> {</span></span>
<span class="line"><span style="color:#D8DEE9FF;">                count</span><span style="color:#81A1C1;">++;</span></span>
<span class="line"><span style="color:#D8DEE9;">                System</span><span style="color:#ECEFF4;">.</span><span style="color:#D8DEE9;">out</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">println</span><span style="color:#ECEFF4;">(</span><span style="color:#D8DEE9FF;">i </span><span style="color:#81A1C1;">+</span><span style="color:#ECEFF4;"> &quot;</span><span style="color:#A3BE8C;">误判了</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#ECEFF4;">)</span><span style="color:#81A1C1;">;</span></span>
<span class="line"><span style="color:#ECEFF4;">            }</span></span>
<span class="line"><span style="color:#ECEFF4;">        }</span></span>
<span class="line"><span style="color:#D8DEE9;">        System</span><span style="color:#ECEFF4;">.</span><span style="color:#D8DEE9;">out</span><span style="color:#ECEFF4;">.</span><span style="color:#88C0D0;">println</span><span style="color:#ECEFF4;">(</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#A3BE8C;">总共的误判数:</span><span style="color:#ECEFF4;">&quot;</span><span style="color:#81A1C1;"> +</span><span style="color:#D8DEE9FF;"> count</span><span style="color:#ECEFF4;">)</span><span style="color:#81A1C1;">;</span></span>
<span class="line"><span style="color:#ECEFF4;">    }</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="代码分析" tabindex="-1"><a class="header-anchor" href="#代码分析"><span>代码分析</span></a></h3><p>上面的代码中，我们创建了一个布隆过滤器，其中有两个重要的参数，分别是我们要预计插入的数据和我们所期望的误判率，误判率率不能为0。</p><p>我们首先向布隆过滤器中插入 0 ~ 100万条数据，然后在用 100万 ~ 200万的数据进行测试</p><p>我们输出结果，查看一下误判率</p><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" data-title="java" style="background-color:#2e3440ff;color:#d8dee9ff;"><pre class="shiki nord vp-code"><code><span class="line"><span style="color:#D8DEE9FF;">1999501误判了</span></span>
<span class="line"><span style="color:#D8DEE9FF;">1999567误判了</span></span>
<span class="line"><span style="color:#D8DEE9FF;">1999640误判了</span></span>
<span class="line"><span style="color:#D8DEE9FF;">1999697误判了</span></span>
<span class="line"><span style="color:#D8DEE9FF;">1999827误判了</span></span>
<span class="line"><span style="color:#D8DEE9FF;">1999942误判了</span></span>
<span class="line"><span style="color:#D8DEE9FF;">总共的误判数</span><span style="color:#81A1C1;">:</span><span style="color:#B48EAD;">10314</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>现在有100万不存在的数据，误判了10314次，我们计算一下误判率</p><div class="language-java line-numbers-mode" data-highlighter="shiki" data-ext="java" data-title="java" style="background-color:#2e3440ff;color:#d8dee9ff;"><pre class="shiki nord vp-code"><code><span class="line"><span style="color:#B48EAD;">10314</span><span style="color:#81A1C1;"> /</span><span style="color:#B48EAD;"> 1000000</span><span style="color:#81A1C1;"> =</span><span style="color:#B48EAD;"> 0.010314</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>和我们之前定义的误判率为0.01相差无几</p><h2 id="参考" tabindex="-1"><a class="header-anchor" href="#参考"><span>参考</span></a></h2><p>https://www.cnblogs.com/rinack/p/9712477.html</p><p>https://www.jianshu.com/p/2104d11ee0a2</p><p>https://www.cnblogs.com/CodeBear/p/10911177.html</p>`,38);function r(d,y){return o(),a("div",null,[i,l(" more "),c])}const m=n(t,[["render",r],["__file","5.Redis持久化（落盘）.html.vue"]]),h=JSON.parse('{"path":"/note/redis/5.Redis%E6%8C%81%E4%B9%85%E5%8C%96%EF%BC%88%E8%90%BD%E7%9B%98%EF%BC%89.html","title":"Redis缓存穿透-布隆过滤器","lang":"zh-CN","frontmatter":{"title":"Redis缓存穿透-布隆过滤器","cover":"/assets/images/cover1.jpg","icon":"file","order":3,"author":"HotMilk","category":["Redis"],"tag":["缓存穿透","布隆过滤器"],"description":"more 注释之前的内容被视为文章摘要。","head":[["meta",{"property":"og:url","content":"https://reniunai.github.io/note/redis/5.Redis%E6%8C%81%E4%B9%85%E5%8C%96%EF%BC%88%E8%90%BD%E7%9B%98%EF%BC%89.html"}],["meta",{"property":"og:site_name","content":"热牛奶"}],["meta",{"property":"og:title","content":"Redis缓存穿透-布隆过滤器"}],["meta",{"property":"og:description","content":"more 注释之前的内容被视为文章摘要。"}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://reniunai.github.io/assets/images/cover1.jpg"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2024-08-05T08:48:07.000Z"}],["meta",{"name":"twitter:card","content":"summary_large_image"}],["meta",{"name":"twitter:image:src","content":"https://reniunai.github.io/assets/images/cover1.jpg"}],["meta",{"name":"twitter:image:alt","content":"Redis缓存穿透-布隆过滤器"}],["meta",{"property":"article:author","content":"HotMilk"}],["meta",{"property":"article:tag","content":"缓存穿透"}],["meta",{"property":"article:tag","content":"布隆过滤器"}],["meta",{"property":"article:modified_time","content":"2024-08-05T08:48:07.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Redis缓存穿透-布隆过滤器\\",\\"image\\":[\\"https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151815101.png\\",\\"https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151815065.png\\",\\"https://hotmilk-pic.oss-cn-shenzhen.aliyuncs.com/assets/202407151815085.png\\"],\\"dateModified\\":\\"2024-08-05T08:48:07.000Z\\",\\"author\\":[{\\"@type\\":\\"Person\\",\\"name\\":\\"HotMilk\\"}]}"]]},"headers":[{"level":2,"title":"缓存穿透","slug":"缓存穿透","link":"#缓存穿透","children":[]},{"level":2,"title":"简单的解决方法","slug":"简单的解决方法","link":"#简单的解决方法","children":[]},{"level":2,"title":"布隆过滤器","slug":"布隆过滤器","link":"#布隆过滤器","children":[{"level":3,"title":"什么是布隆过滤器","slug":"什么是布隆过滤器","link":"#什么是布隆过滤器","children":[]},{"level":3,"title":"原理","slug":"原理","link":"#原理","children":[]},{"level":3,"title":"使用","slug":"使用","link":"#使用","children":[]},{"level":3,"title":"代码分析","slug":"代码分析","link":"#代码分析","children":[]}]},{"level":2,"title":"参考","slug":"参考","link":"#参考","children":[]}],"git":{"createdTime":1721001506000,"updatedTime":1722847687000,"contributors":[{"name":"reniunai","email":"2843768@qq.com","commits":1}]},"readingTime":{"minutes":4.99,"words":1496},"filePathRelative":"note/redis/5.Redis持久化（落盘）.md","localizedDate":"2024年7月14日","excerpt":"<p><code>more</code> 注释之前的内容被视为文章摘要。</p>\\n","autoDesc":true}');export{m as comp,h as data};
