
function makeMap(str) {
    var obj = {}, items = str.split(",");
    for (var i = 0; i < items.length; i++)
        obj[items[i]] = true;
    return obj;
}
// Regular Expressions for parsing tags and attributes
// var startTag = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,  // liufh 注释  2022-8-3
var startTag = /^<([-A-Za-z0-9_]+)((?:\s+[a-zA-Z_:@][-a-zA-Z0-9_:.]*(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,    // liufh 添加 @ 符号的支持，vue需要类似 @click 的属性 2022-8-3
    endTag = /^<\/([-A-Za-z0-9_]+)[^>]*>/,
    // attr = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;		// liufh 注释  2022-8-3
    attr = /([a-zA-Z_:@][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;		// liufh 添加 @ 符号的支持，vue需要类似 @click 的属性 2022-8-3

// Empty Elements - HTML 5
var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,link,meta,param,embed,command,keygen,source,track,wbr");

// Block Elements - HTML 5
var block = makeMap("a,address,article,applet,aside,audio,blockquote,button,canvas,center,dd,del,dir,div,dl,dt,fieldset,figcaption,figure,footer,form,frameset,h1,h2,h3,h4,h5,h6,header,hgroup,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,output,p,pre,section,script,table,tbody,td,tfoot,th,thead,tr,ul,video");

// Inline Elements - HTML 5
var inline = makeMap("abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

// Elements that you can, intentionally, leave open
// (and which close themselves)
var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

// Attributes that have their values filled in disabled="disabled"
var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

// Special Elements (can contain anything)
var special = makeMap("script,style");

var HTMLParser = function (html, handler) {
    var index, chars, match, stack = [], last = html;
    stack.last = function () {
        return this[this.length - 1];
    };

    while (html) {
        chars = true;

        // Make sure we're not in a script or style element
        if (!stack.last() || !special[stack.last()]) {

            // Comment
            if (html.indexOf("<!--") == 0) {
                index = html.indexOf("-->");

                if (index >= 0) {
                    if (handler.comment)
                        handler.comment(html.substring(4, index));
                    html = html.substring(index + 3);
                    chars = false;
                }

                // end tag
            } else if (html.indexOf("</") == 0) {
                match = html.match(endTag);

                if (match) {
                    html = html.substring(match[0].length);
                    match[0].replace(endTag, parseEndTag);
                    chars = false;
                }

                // start tag
            } else if (html.indexOf("<") == 0) {
                console.log(html);
                match = html.match(startTag);
                if (html.indexOf('@') !== -1) {
                    console.log();
                }
                if (match) {
                    html = html.substring(match[0].length);
                    match[0].replace(startTag, parseStartTag);
                    chars = false;
                }
            }

            if (chars) {
                index = html.indexOf("<");

                var text = index < 0 ? html : html.substring(0, index);
                html = index < 0 ? "" : html.substring(index);

                if (handler.chars)
                    handler.chars(text);
            }

        } else {
            html = html.replace(new RegExp("([\\s\\S]*?)<\/" + stack.last() + "[^>]*>"), function (all, text) {
                if (text.indexOf('@') !== -1) {
                    console.log();
                }
                text = text.replace(/<!--([\s\S]*?)-->|<!\[CDATA\[([\s\S]*?)]]>/g, "$1$2");
                if (handler.chars)
                    handler.chars(text);

                return "";
            });

            parseEndTag("", stack.last());
        }

        if (html == last)
            throw "Parse Error: " + html;
        last = html;
    }

    // Clean up any remaining tags
    parseEndTag();

    function parseStartTag(tag, tagName, rest, unary) {
        tagName = tagName.toLowerCase();

        if (block[tagName]) {
            while (stack.last() && inline[stack.last()]) {
                parseEndTag("", stack.last());
            }
        }

        if (closeSelf[tagName] && stack.last() == tagName) {
            parseEndTag("", tagName);
        }

        unary = empty[tagName] || !!unary;

        if (!unary)
            stack.push(tagName);

        if (handler.start) {
            var attrs = [];

            rest.replace(attr, function (match, name) {
                var value = arguments[2] ? arguments[2] :
                    arguments[3] ? arguments[3] :
                        arguments[4] ? arguments[4] :
                            fillAttrs[name] ? name : "";

                attrs.push({
                    name: name,
                    value: value,
                    escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
                });
            });

            if (handler.start)
                handler.start(tagName, attrs, unary);
        }
    }

    function parseEndTag(tag, tagName) {
        if (tagName !== undefined) tagName = tagName.toLowerCase();
        // If no tag name is provided, clean shop
        if (!tagName)
            var pos = 0;

        // Find the closest opened tag of the same type
        else
            for (var pos = stack.length - 1; pos >= 0; pos--)
                if (stack[pos] == tagName)
                    break;

        if (pos >= 0) {
            // Close all the open elements, up the stack
            for (var i = stack.length - 1; i >= pos; i--)
                if (handler.end)
                    handler.end(stack[i]);

            // Remove the open elements from the stack
            stack.length = pos;
        }
    }
};


module.exports = function (htmlStr) {
    const result = {};
    // var htmlStr = `
    // <el-form ref="form" :model="form" label-width="80px">
    //     <el-form-item label="活动名称">
    //         <el-input v-model="form.name"></el-input>
    //     </el-form-item>
    //     <el-form-item label="活动区域">
    //         <el-select v-model="form.region" placeholder="请选择活动区域">
    //         <el-option label="区域一" value="shanghai"></el-option>
    //         <el-option label="区域二" value="beijing"></el-option>
    //         </el-select>
    //     </el-form-item>
    //     <el-form-item label="活动时间">
    //         <el-col :span="11">
    //         <el-date-picker type="date" placeholder="选择日期" v-model="form.date1" style="width: 100%;"></el-date-picker>
    //         </el-col>
    //         <el-col class="line" :span="2">-</el-col>
    //         <el-col :span="11">
    //         <el-time-picker placeholder="选择时间" v-model="form.date2" style="width: 100%;"></el-time-picker>
    //         </el-col>
    //     </el-form-item>
    //     <el-form-item label="即时配送">
    //         <el-switch v-model="form.delivery"></el-switch>
    //     </el-form-item>
    //     <el-form-item label="活动性质">
    //         <el-checkbox-group v-model="form.type">
    //         <el-checkbox label="美食/餐厅线上活动" name="type"></el-checkbox>
    //         <el-checkbox label="地推活动" name="type"></el-checkbox>
    //         <el-checkbox label="线下主题活动" name="type"></el-checkbox>
    //         <el-checkbox label="单纯品牌曝光" name="type"></el-checkbox>
    //         </el-checkbox-group>
    //     </el-form-item>
    //     <el-form-item label="特殊资源">
    //         <el-radio-group v-model="form.resource">
    //         <el-radio label="线上品牌商赞助"></el-radio>
    //         <el-radio label="线下场地免费"></el-radio>
    //         </el-radio-group>
    //     </el-form-item>
    //     <el-form-item label="活动形式">
    //         <el-input type="textarea" v-model="form.desc"></el-input>
    //     </el-form-item>
    //     <el-form-item>
    //         <el-button type="primary" @click="onSubmit">立即创建</el-button>
    //         <el-button>取消</el-button>
    //     </el-form-item>
    // </el-form>
    // `;
    var parentTagObj;
    var curTagValueArr;
    var filoObjArr = []; // first in last out array
    var isEndOfTag = true;
    HTMLParser(htmlStr, {
        start: function (tag, attrs, unary) {
            var tag_obj;
            isEndOfTag = false;
            if (filoObjArr.length === 0) {
                tag_obj = result;
                tag_obj[tag] = [];
                filoObjArr.push(tag_obj);
                curTagValueArr = tag_obj[tag];
            }
            else {
                tag_obj = {};
                tag_obj[tag] = [];
                filoObjArr.push(tag_obj);
                curTagValueArr.push(tag_obj);
                curTagValueArr = tag_obj[tag];
            }

            for (var i = 0; i < attrs.length; i++) {
                const attr_obj = {};
                const attr = attrs[i];
                attr_obj['$' + attr.name] = attr.value;
                curTagValueArr.push(attr_obj);
            }
        },
        end: function (tag) {
            filoObjArr.pop();
            const last_index = filoObjArr.length - 1;
            if (last_index < 0) {
                return;
            }
            const obj = filoObjArr[last_index];
            curTagValueArr = Object.values(obj)[0];
            isEndOfTag = true;
        },
        chars: function (text) {
            console.log(text);
            if (isEndOfTag) { //&& (text==='\n' || !curTagValueArr || /^\x20+$/g.test(text) ) ) {
                return;
            }
            curTagValueArr.push({ $innerText: text });
        },
        comment: function (text) {
            console.log(text);
        }
    });

    console.log(result);
    return result;
};