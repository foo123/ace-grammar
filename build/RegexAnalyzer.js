/**
*
*   RegexAnalyzer
*   @version: 0.4.5
*
*   A simple Regular Expression Analyzer for PHP, Python, Node/JS, ActionScript
*   https://github.com/foo123/RegexAnalyzer
*
**/
!function(e,t,r){"use strict";var a,n="object"==typeof module&&module.exports,s="function"==typeof define&&define.amd;n?module.exports=(module.$deps=module.$deps||{})[t]=module.$deps[t]||r.call(e,{NODE:module})||1:s&&"function"==typeof require&&"function"==typeof require.specified&&require.specified(t)?define(t,["require","exports","module"],function(t,a,n){return r.call(e,{AMD:n})}):t in e||(e[t]=a=r.call(e,{})||1)&&s&&define(t,[],function(){return a})}(this,"RegexAnalyzer",function(){"use strict";var e="0.4.5",t="prototype",r=Object,a=r.keys,n=(r[t].toString,String.fromCharCode),s="charAt",l="charCodeAt",o=(JSON.stringify,1/0),u="hasOwnProperty",i="\\",h={".":"MatchAnyChar","|":"MatchEither","?":"MatchZeroOrOne","*":"MatchZeroOrMore","+":"MatchOneOrMore","^":"MatchStart",$:"MatchEnd","{":"StartRepeats","}":"EndRepeats","(":"StartGroup",")":"EndGroup","[":"StartCharGroup","]":"EndCharGroup"},p={"\\":"EscapeChar","/":"/",0:"NULChar",f:"FormFeed",n:"LineFeed",r:"CarriageReturn",t:"HorizontalTab",v:"VerticalTab",b:"MatchWordBoundary",B:"MatchNonWordBoundary",s:"MatchSpaceChar",S:"MatchNonSpaceChar",w:"MatchWordChar",W:"MatchNonWordChar",d:"MatchDigitChar",D:"MatchNonDigitChar"},f=1,c=2,g=3,v=4,d=5,y=6,M=7,m=8,C=9,N=10,_=11,k=function(e){var t=this;t.re=e,t.len=e.length,t.pos=0,t.groupIndex=0,t.inGroup=0},O=function nt(e,t,r){var a=this;if(!(a instanceof nt))return new nt(e,t,r);switch(a.type=e,a.val=t,a.flags=r||{},e){case f:a.typeName="Sequence";break;case c:a.typeName="Alternation";break;case g:a.typeName="Group";break;case m:a.typeName="CharacterGroup";break;case C:a.typeName="Characters";break;case N:a.typeName="CharacterRange";break;case _:a.typeName="String";break;case v:a.typeName="Quantifier";break;case d:a.typeName="UnicodeChar";break;case y:a.typeName="HexChar";break;case M:a.typeName="Special"}};O.toObjectStatic=function st(e){return e instanceof O?{type:e.typeName,value:st(e.val),flags:e.flags}:e instanceof Array?e.map(st):e},O[t]={constructor:O,type:null,typeName:null,val:null,flags:null,dispose:function(){var e=this;return e.val=null,e.flags=null,e.type=null,e.typeName=null,e},toObject:function(){return O.toObjectStatic(this)}};var b=function(e,t){return Math.round((t-e)*Math.random()+e)},x=function(e){return e[l](0)},S=function(e){return[e[l](0),e[l](e.length-1)]},G=function(e,t){e&&"function"==typeof e.push&&(t=e[1],e=e[0]);var r,a,s=e[l](0),o=t[l](0);if(o==s)return[n(s)];for(a=[],r=s;o>=r;++r)a.push(n(r));return a},R=function(e,t){if(t){var r,a;if("function"==typeof t.push)for(r=0,a=t.length;a>r;r++)e[t[r]]=1;else for(r in t)t[u](r)&&(e[r]=1)}return e},w=" 	",A="~!@#$%^&*()-+=[]{}\\|;:,./<>?",E="0123456789",W=S(E),I=[W,[x("a"),x("f")],[x("A"),x("F")]],Z="_"+G("a","z").join("")+G("A","Z").join(""),D=w+A+E+Z,j=D.split(""),z=function(e,t,r,a,n){r=r||0,a=a||1,n=n||o;for(var l,u=r,i=0,h=t.length;h>u&&n>=i&&-1<e.indexOf(l=t[s](u));)u++,i++;return i>=a?i:!1},L=function(e,t,r,a,n){r=r||0,a=a||1,n=n||o;for(var s,u=r,i=0,h=t.length;h>u&&n>=i&&(s=t[l](u))>=e[0]&&s<=e[1];)u++,i++;return i>=a?i:!1},$=function(e,t,r,a,n){r=r||0,a=a||1,n=n||o;for(var s,u,i,h=r,p=0,f=t.length,c=e.length,g=!0;f>h&&n>=p&&g;)for(s=t[l](h),g=!1,u=0;c>u;u++)if(i=e[u],s>=i[0]&&s<=i[1]){h++,p++,g=!0;break}return p>=a?p:!1},q=function(){return A[s](b(0,A.length-1))},F=function(e){return!1!==e?w[s](b(0,w.length-1)):(q()+U()+B())[s](b(0,2))},U=function(e){return!1!==e?E[s](b(0,E.length-1)):(q()+F()+B())[s](b(0,2))},B=function(e){return!1!==e?Z[s](b(0,Z.length-1)):(q()+F()+U())[s](b(0,2))},P=function(e){return!1!==e?(Z+E)[s](b(0,Z.length+E.length-1)):(q()+F())[s](b(0,1))},H=function(){return D[s](b(0,D.length-1))},T=function(e,t){if(!1!==t)return e.length?e[b(0,e.length-1)]:"";var r=j.filter(function(t){return 0>e.indexOf(t)});return r.length?r[b(0,r.length-1)]:""},V=function(e){return b(0,1)?e.toLowerCase():e.toUpperCase()},J=function(e,t){return t?(e[s]&&(e=e.split("")),e=e.map(V)):V(e)},Q=function lt(e,t){var r,a,n,s,l="";if(s=e.type,c===s)l+=lt(e.val[b(0,e.val.length-1)],t);else if(g===s)l+=lt(e.val,t);else if(f===s){var o,u,i;for(n=e.val.length,r=e.val[a],a=0;n>a;a++)if(r=e.val[a])if(o=1,v===r.type)for(r.flags.MatchZeroOrMore?o=b(0,10):r.flags.MatchZeroOrOne?o=b(0,1):r.flags.MatchOneOrMore?o=b(1,11):(u=parseInt(r.flags.MatchMinimum,10),i=parseInt(r.flags.MatchMaximum,10),o=b(u,isNaN(i)?u+10:i));o>0;)o--,l+=lt(r.val,t);else M===r.type?r.flags.MatchAnyChar&&(l+=H()):l+=lt(r,t)}else if(m===s){var h,p=[];for(a=0,n=e.val.length;n>a;a++)if(r=e.val[a],h=r.type,C===h)p=p.concat(t?J(r.val,!0):r.val);else if(N===h)p=p.concat(t?J(G(r.val),!0):G(r.val));else if(d===h||y===h)p.push(t?J(r.flags.Char):r.flags.Char);else if(M===h){var k=r.val;p.push("D"==k?U(!1):"W"==k?P(!1):"S"==k?F(!1):"d"==k?U():"w"==k?P():"s"==k?F():"\\"+k)}l+=T(p,!e.flags.NotMatch)}else if(_===s)l+=t?J(e.val):e.val;else if(M!==s||e.flags.MatchStart||e.flags.MatchEnd)(d===s||y===s)&&(l+=t?J(e.flags.Char):e.flags.Char);else{var k=e.val;l+="D"==k?U(!1):"W"==k?P(!1):"S"==k?F(!1):"d"==k?U():"w"==k?P():"s"==k?F():"."==k?H():"\\"+k}return l},K=function ot(e){var t,r,a,n,l,o,u,i,h={},p={};if(u=e.type,c===u)for(a=0,n=e.val.length;n>a;a++)l=ot(e.val[a]),h=R(h,l.peek),p=R(p,l.negativepeek);else if(g===u)l=ot(e.val),h=R(h,l.peek),p=R(p,l.negativepeek);else if(f===u){for(a=0,n=e.val.length,r=e.val[a],o=a>=n||!r||v!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;!o;)l=ot(r.val),h=R(h,l.peek),p=R(p,l.negativepeek),a++,r=e.val[a],o=a>=n||!r||v!=r.type||!r.flags.MatchZeroOrMore&&!r.flags.MatchZeroOrOne&&"0"!=r.flags.MatchMinimum;n>a&&(r=e.val[a],M!==r.type||"^"!=r.val&&"$"!=r.val||(r=e.val[a+1]||null),r&&v===r.type&&(r=r.val),r&&(l=ot(r),h=R(h,l.peek),p=R(p,l.negativepeek)))}else if(m===u){for(t=e.flags.NotMatch?p:h,a=0,n=e.val.length;n>a;a++)if(r=e.val[a],i=r.type,C===i)t=R(t,r.val);else if(N===i)t=R(t,G(r.val));else if(d===i||y===i)t[r.flags.Char]=1;else if(M===i){var k=r.val;"D"==k?e.flags.NotMatch?h["\\d"]=1:p["\\d"]=1:"W"==k?e.flags.NotMatch?h["\\w"]=1:p["\\W"]=1:"S"==k?e.flags.NotMatch?h["\\s"]=1:p["\\s"]=1:t["\\"+k]=1}}else _===u?h[e.val[s](0)]=1:M!==u||e.flags.MatchStart||e.flags.MatchEnd?(d===u||y===u)&&(h[e.flags.Char]=1):"D"==e.val?p["\\d"]=1:"W"==e.val?p["\\W"]=1:"S"==e.val?p["\\s"]=1:h["\\"+e.val]=1;return{peek:h,negativepeek:p}},X=function(e){var t=!1;return e.length>2&&"x"===e[s](0)&&$(I,e,1,2,2)?[t=e.slice(0,3),t.slice(1)]:!1},Y=function(e){var t=!1;return e.length>4&&"u"===e[s](0)&&$(I,e,1,4,4)?[t=e.slice(0,5),t.slice(1)]:!1},et=function(e){var t,r=e.length,a=0,n=!1;return r>2&&"{"===e[s](a)?(n=["","",null],a++,(t=z(w,e,a))&&(a+=t),(t=L(W,e,a))?(n[1]=e.slice(a,a+t),a+=t,(t=z(w,e,a))&&(a+=t),r>a&&","===e[s](a)&&(a+=1),(t=z(w,e,a))&&(a+=t),(t=L(W,e,a))&&(n[2]=e.slice(a,a+t),a+=t),(t=z(w,e,a))&&(a+=t),r>a&&"}"===e[s](a)?(a++,n[0]=e.slice(0,a),n):!1):!1):!1},tt=function(e){var t,r,a,l,o,h,f,c=[],g=[],v={},d=!1,y=!1;for("^"==e.re[s](e.pos)&&(v.NotMatch=1,e.pos++),a=e.len;e.pos<a;)if(f=!1,l=r,r=e.re[s](e.pos++),y=i==r?!0:!1,y&&(r=e.re[s](e.pos++)),y&&("u"==r?(h=Y(e.re.substr(e.pos-1)),e.pos+=h[0].length-1,r=n(parseInt(h[1],16)),f=!0):"x"==r&&(h=X(e.re.substr(e.pos-1)),e.pos+=h[0].length-1,r=n(parseInt(h[1],16)),f=!0)),d)g.length&&(c.push(O(C,g)),g=[]),o[1]=r,d=!1,c.push(O(N,o));else if(y)!f&&p[u](r)&&"/"!=r?(g.length&&(c.push(O(C,g)),g=[]),t={},t[p[r]]=1,c.push(O(M,r,t))):g.push(r);else{if("]"==r)return g.length&&(c.push(O(C,g)),g=[]),O(m,c,v);"-"==r?(o=[l,""],g.pop(),d=!0):g.push(r)}return g.length&&(c.push(O(C,g)),g=[]),O(m,c,v)},rt=function ut(e){var t,r,a,l,o,m="",C=0,N=[],k=[],b={},x=!1;for(e.inGroup>0&&(o=e.re.substr(e.pos,2),"?:"==o?(b.NotCaptured=1,e.pos+=2):"?="==o?(b.LookAhead=1,e.pos+=2):"?!"==o&&(b.NegativeLookAhead=1,e.pos+=2),b.GroupIndex=++e.groupIndex),t=e.len;e.pos<t;)if(r=e.re[s](e.pos++),x=i==r?!0:!1,x&&(r=e.re[s](e.pos++)),x)"u"==r?(C&&(k.push(O(_,m)),m="",C=0),a=Y(e.re.substr(e.pos-1)),e.pos+=a[0].length-1,k.push(O(d,a[0],{Char:n(parseInt(a[1],16)),Code:a[1]}))):"x"==r?(C&&(k.push(O(_,m)),m="",C=0),a=X(e.re.substr(e.pos-1)),e.pos+=a[0].length-1,k.push(O(y,a[0],{Char:n(parseInt(a[1],16)),Code:a[1]}))):p[u](r)&&"/"!=r?(C&&(k.push(O(_,m)),m="",C=0),l={},l[p[r]]=1,k.push(O(M,r,l))):(m+=r,C+=1);else{if(e.inGroup>0&&")"==r)return C&&(k.push(O(_,m)),m="",C=0),N.length?(N.push(O(f,k)),k=[],l={},l[h["|"]]=1,O(g,O(c,N,l),b)):O(g,O(f,k),b);if("|"==r)C&&(k.push(O(_,m)),m="",C=0),N.push(O(f,k)),k=[];else if("["==r)C&&(k.push(O(_,m)),m="",C=0),k.push(tt(e));else if("("==r)C&&(k.push(O(_,m)),m="",C=0),e.inGroup+=1,k.push(ut(e)),e.inGroup-=1;else if("{"==r){C&&(k.push(O(_,m)),m="",C=0),a=et(e.re.substr(e.pos-1)),e.pos+=a[0].length-1,l={val:a[0],MatchMinimum:a[1],MatchMaximum:a[2]||"unlimited"},l[h[r]]=1,e.pos<t&&"?"==e.re[s](e.pos)?(l.isGreedy=0,e.pos++):l.isGreedy=1;var S=k.pop();_===S.type&&S.val.length>1&&(k.push(O(_,S.val.slice(0,-1))),S.val=S.val.slice(-1)),k.push(O(v,S,l))}else if("*"==r||"+"==r||"?"==r){C&&(k.push(O(_,m)),m="",C=0),l={},l[h[r]]=1,e.pos<t&&"?"==e.re[s](e.pos)?(l.isGreedy=0,e.pos++):l.isGreedy=1;var S=k.pop();_===S.type&&S.val.length>1&&(k.push(O(_,S.val.slice(0,-1))),S.val=S.val.slice(-1)),k.push(O(v,S,l))}else h[u](r)?(C&&(k.push(O(_,m)),m="",C=0),l={},l[h[r]]=1,k.push(O(M,r,l))):(m+=r,C+=1)}return C&&(k.push(O(_,m)),m="",C=0),N.length?(N.push(O(f,k)),k=[],l={},b[h["|"]]=1,O(c,N,l)):O(f,k)},at=function it(e,t){return this instanceof it?void(e&&this.regex(e,t)):new it(e,t)};return at.VERSION=e,at.Node=O,at.getCharRange=G,at[t]={constructor:at,_regex:null,_flags:null,_parts:null,_needsRefresh:!1,dispose:function(){var e=this;return e._regex=null,e._flags=null,e._parts=null,e},regex:function(e,t){var r=this;if(e){t=t||"/";for(var a={},n=e.toString(),l=n.length,o=n[s](l-1);t!==o;)a[o]=1,n=n.slice(0,-1),l=n.length,o=n[s](l-1);t==n[s](0)&&t==n[s](l-1)&&(n=n.slice(1,-1)),r._regex!==n&&(r._needsRefresh=!0),r._regex=n,r._flags=a}return r},getRegex:function(){return new RegExp(this._regex,a(this._flags).join(""))},getParts:function(){var e=this;return e._needsRefresh&&e.analyze(),e._parts},analyze:function(){var e=this;return e._needsRefresh&&(e._parts=rt(new k(e._regex)),e._needsRefresh=!1),e},sample:function(){var e=this;return e._needsRefresh&&e.analyze(),Q(e._parts,e._flags&&e._flags.i)},match:function(){return!1},peek:function(){var e,t,r,a,n,l,o=this;o._needsRefresh&&o.analyze(),t=K(o._parts),e=o._flags&&o._flags.i;for(r in t){l={},n=t[r];for(a in n)"\\d"==a?(delete n[a],l=R(l,G("0","9"))):"\\s"==a?(delete n[a],l=R(l,["\f","\n","\r","	",""," ","\u2028","\u2029"])):"\\w"==a?(delete n[a],l=R(l,["_"].concat(G("0","9")).concat(G("a","z")).concat(G("A","Z")))):"\\."==a?(delete n[a],l[h["."]]=1):"\\"!=a[s](0)&&e?(l[a.toLowerCase()]=1,l[a.toUpperCase()]=1):"\\"==a[s](0)&&delete n[a];t[r]=R(n,l)}return t}},at[t].getPeekChars=at[t].peek,at[t].generateSample=at[t].sample,at});