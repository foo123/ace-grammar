    
    //
    // folder factories (IN PROGRESS)
    var
        AceFoldMode = Class(ace_require("ace/fold_mode").FoldMode, {
            constructor: function(folds, RegExpID) {
                if ( folds )
                {
                    for (var type in folds)
                    {
                        folds[type] = getBlockMatcher(type, folds[type], RegExpID, {}, {});
                    }
                    this.folds = folds;
                }
            },
            
            folds: null,
            
            getFoldWidgetRange: function(session, foldStyle, row) {
                var firstTag = this._getFirstTagInLine(session, row);

                if (!firstTag.match)
                return null;

                var isBackward = firstTag.closing || firstTag.selfClosing;
                var stack = [];
                var tag;

                if (!isBackward) {
                var iterator = new TokenIterator(session, row, firstTag.column);
                var start = {
                row: row,
                column: firstTag.column + firstTag.tagName.length + 2
                };
                while (tag = this._readTagForward(iterator)) {
                if (tag.selfClosing) {
                if (!stack.length) {
                tag.start.column += tag.tagName.length + 2;
                tag.end.column -= 2;
                return Range.fromPoints(tag.start, tag.end);
                } else
                continue;
                }

                if (tag.closing) {
                this._pop(stack, tag);
                if (stack.length == 0)
                return Range.fromPoints(start, tag.start);
                }
                else {
                stack.push(tag)
                }
                }
                }
                else {
                var iterator = new TokenIterator(session, row, firstTag.column + firstTag.match.length);
                var end = {
                row: row,
                column: firstTag.column
                };

                while (tag = this._readTagBackward(iterator)) {
                if (tag.selfClosing) {
                if (!stack.length) {
                tag.start.column += tag.tagName.length + 2;
                tag.end.column -= 2;
                return Range.fromPoints(tag.start, tag.end);
                } else
                continue;
                }

                if (!tag.closing) {
                this._pop(stack, tag);
                if (stack.length == 0) {
                tag.start.column += tag.tagName.length + 2;
                return Range.fromPoints(tag.start, end);
                }
                }
                else {
                stack.push(tag)
                }
                }
                }

            },
            
            getClosingBlock: function(session, startMatcher, endMatcher, row, column, type) {
                var stack = [],
                    TokenIterator = ace_require('ace/token_iterator').TokenIterator,
                    Range = ace_require('ace/range').Range,
                    token, value, m,
                    start, end = null, iterator
                ;

                start = start = {row: row, column: column};
                iterator = new TokenIterator(this, row, column);
                token = iterator.getCurrentToken();
                if ( !token ) token = iterator.stepForward();

                while ( token ) 
                {
                    value = new ParserStream( token.value );
                    
                    if ( m = startMatcher.get(value) )
                    {
                        stack.push(m);
                    } 
                    else if ( stack.length && stack[stack.length-1].get( value ) )
                    {
                        stack.pop();
                    }
                    else if ( !stack.length && type == token.type && endMatcher.get( value ) )
                    {
                        end  = {
                            row: iterator.getCurrentTokenRow(),
                            column: iterator.getCurrentTokenColumn()
                        };
                        break;
                    }
                    else
                    {
                        token = iterator.stepForward();
                    }
                    if ( !token )  break;
                }

                if ( !end ) return;

                var fw = session.foldWidgets[ end.row ];
                if ( !fw )  fw = session.getFoldWidget( end.row );

                if ( "start" == fw && end.row > start.row ) 
                {
                    end.row --;
                    end.column = session.getLine( end.row ).length;
                }
                return Range.fromPoints(start, end);
            }
        })
    ;
  