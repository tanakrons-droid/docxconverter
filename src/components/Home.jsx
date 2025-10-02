import React, { useState } from 'react';
import mammoth from 'mammoth';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowUp, faFileImport, faCopy, faCircleNotch } from '@fortawesome/free-solid-svg-icons';


function Home() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleFileChange = (event) => {
    const fileTarget = event.target.files[0];
    const fileLabel = document.querySelector('.upload-file-label');
    if (fileTarget) {
      setFile(fileTarget);
      fileLabel.innerHTML = `${fileTarget.name}`;
    } else {
      setFile(null);
      fileLabel.innerHTML = `<strong>Click to upload</strong> or drag and drop<br />DOCX are Allowed.`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1000);
    });
  };

  const handleConvert = async () => {
    // Flags
    const WP_EXPORT_MODE = true; // Prevents base64 image data -> avoids Gutenberg freeze
    const DEBUG = false; // Set to true to log stages in console
    const _stages = [];
    const _logStage = (name, payload) => {
      if (!DEBUG) return;
      try {
        const info = typeof payload === 'string' ? payload.slice(0, 300) : JSON.stringify(payload).slice(0, 300);
        _stages.push(`✔ ${name}: ${info.length} chars`);
        if (window && window.console && process.env.NODE_ENV === 'development') console.log(`[CONVERT] ${name}`, payload);
      } catch (e) {
        _stages.push(`(log failed at ${name}: ${e && e.message})`);
      }
    };
    
    if (!file) return;
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      try {
        const options = {
  styleMap: [
    "u => u",
    "r[style-name*='Underline'] => u"
  ],
  includeEmbeddedStyleMap: true

  ,convertImage: mammoth.images.imgElement(function(image) {
    if (WP_EXPORT_MODE) return { src: "" };
    return image.read("base64").then(function(buffer) {
      var contentType = image.contentType || "image/png";
      return { src: "data:" + contentType + ";base64," + buffer };
    });
  })
}
_logStage('read file', arrayBuffer && ('ArrayBuffer ' + arrayBuffer.byteLength));
const result = await mammoth.convertToHtml({ arrayBuffer }, options);
_logStage('mammoth.convertToHtml()', (result && result.value) || '(no value)');
        let htmlString = result.value;
        _logStage('start postprocess', htmlString);

        // Post-processing: Create Row Layout with 2 sections from consecutive content
        function createRowLayoutFromContent(htmlString) {
          // Mock WordPress Blocks API functions
          const createBlock = (name, attributes = {}, innerBlocks = []) => ({
            name,
            attributes,
            innerBlocks,
            clientId: Math.random().toString(36).substr(2, 9)
          });

          const parseBlocks = (content) => {
            const blocks = [];
            // Simple regex to match Gutenberg blocks
            const blockRegex = /<!-- wp:([^\s\/]+)(?:\s+([^>]*))?\s*(?:\/)?-->([\s\S]*?)(?:<!-- \/wp:-->|$)/g;
            let match;
            
            while ((match = blockRegex.exec(content)) !== null) {
              const blockName = match[1];
              let attributes = {};
              
              try {
                if (match[2] && match[2].trim().startsWith('{')) {
                  attributes = JSON.parse(match[2]);
                }
              } catch (e) {
                // Ignore invalid JSON attributes
              }
              
              const blockContent = match[3] || '';
              
              // Extract text content for paragraphs
              let textContent = '';
              if (blockName === 'paragraph') {
                const pMatch = blockContent.match(/<p[^>]*>(.*?)<\/p>/);
                if (pMatch) {
                  textContent = pMatch[1];
                }
              }
              
              const innerBlocks = parseBlocks(blockContent);
              
              const block = createBlock(blockName, attributes, innerBlocks);
              if (textContent) {
                block.content = textContent;
              }
              
              blocks.push(block);
            }
            
            return blocks;
          };

          const serializeBlocks = (blocks) => {
            return blocks.map(block => {
              const attributesString = Object.keys(block.attributes).length > 0 
                ? ' ' + JSON.stringify(block.attributes) 
                : '';
              
              if (block.innerBlocks && block.innerBlocks.length > 0) {
                const innerContent = serializeBlocks(block.innerBlocks);
                return `<!-- wp:${block.name}${attributesString} -->${innerContent}<!-- /wp:${block.name} -->`;
              } else {
                // Handle different block types
                if (block.name === 'image') {
                  return `<!-- wp:image -->\n<figure class="wp-block-image"></figure>\n<!-- /wp:image -->`;
                } else if (block.name === 'paragraph') {
                  return `<!-- wp:paragraph${attributesString} --><p>${block.content || ''}</p><!-- /wp:paragraph -->`;
                } else if (block.name === 'kadence/column') {
                  const columnUniqueID = block.attributes.uniqueID || `70684_${Math.random().toString(36).substr(2, 9)}`;
                  const innerContent = block.innerBlocks ? serializeBlocks(block.innerBlocks) : '';
                  return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"${columnUniqueID}","borderStyle":[{"top":["","",""],"right":["","",""],"bottom":["","",""],"left":["","",""],"unit":"px"}]} -->
<div class="wp-block-kadence-column kadence-column${columnUniqueID}"><div class="kt-inside-inner-col">${innerContent}</div></div>
<!-- /wp:kadence/column -->`;
                } else if (block.name === 'kadence/rowlayout') {
                  const rowUniqueID = block.attributes.uniqueID || `70684_${Math.random().toString(36).substr(2, 9)}`;
                  const innerContent = block.innerBlocks ? serializeBlocks(block.innerBlocks) : '';
                  return `<!-- wp:kadence/rowlayout {"uniqueID":"${rowUniqueID}","colLayout":"equal","kbVersion":2} -->\n${innerContent}\n<!-- /wp:kadence/rowlayout -->`;
                }
                return `<!-- wp:${block.name}${attributesString} /-->`;
              }
            }).join('\n');
          };

          // Parse HTML string to blocks
          const parsedBlocks = parseBlocks(htmlString);
          if (process.env.NODE_ENV === 'development') {
            console.log('Parsed blocks:', parsedBlocks.map(b => ({ name: b.name, content: b.content?.substring(0, 50) })));
          }
          
          // Process blocks to create row layouts from consecutive content patterns
          const processBlocks = (blocks) => {
            const processedBlocks = [];
            let i = 0;
            
            while (i < blocks.length) {
              const currentBlock = blocks[i];
              
              // Look for patterns that should become 2-column layouts
              // Pattern 1: Two consecutive paragraphs that look like they should be side by side
              if (currentBlock.name === 'paragraph' && i + 1 < blocks.length) {
                const nextBlock = blocks[i + 1];
                
                if (nextBlock.name === 'paragraph') {
                  // Check if these paragraphs have similar characteristics (length, structure)
                  const currentText = currentBlock.content || '';
                  const nextText = nextBlock.content || '';
                  
                  // More flexible criteria for creating 2-column layouts
                  // Look for paragraphs that are likely to be side-by-side content
                  const shouldCreateLayout = (
                    // Both have reasonable content
                    currentText.length > 20 && nextText.length > 20 &&
                    // Either similar length OR both are short descriptions
                    (Math.abs(currentText.length - nextText.length) < Math.max(currentText.length, nextText.length) * 0.7 ||
                     (currentText.length < 200 && nextText.length < 200))
                  );
                  
                  if (shouldCreateLayout) {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Creating 2-column layout for:', currentText.substring(0, 30), '...and...', nextText.substring(0, 30));
                    }
                    
                    // Create 2-column row layout with proper structure
                    const column1UniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
                    const column2UniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
                    const rowUniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
                    
                    const column1 = createBlock('kadence/column', {
                      borderWidth: ["","","",""],
                      uniqueID: column1UniqueID,
                      borderStyle: [{"top":["","",""],"right":["","",""],"bottom":["","",""],"left":["","",""],"unit":"px"}]
                    }, [
                      createBlock('image', {}),
                      currentBlock
                    ]);
                    
                    const column2 = createBlock('kadence/column', {
                      borderWidth: ["","","",""],
                      uniqueID: column2UniqueID,
                      borderStyle: [{"top":["","",""],"right":["","",""],"bottom":["","",""],"left":["","",""],"unit":"px"}]
                    }, [
                      createBlock('image', {}),
                      nextBlock
                    ]);
                    
                    const rowLayout = createBlock('kadence/rowlayout', {
                      uniqueID: rowUniqueID,
                      colLayout: "equal",
                      kbVersion: 2
                    }, [column1, column2]);
                    
                    processedBlocks.push(rowLayout);
                    
                    i += 2; // Skip both blocks as they're now part of the row layout
                    continue;
                  }
                }
              }
              
              // Pattern 2: Existing kadence/rowlayout with 2 sections - add images if missing
              if (currentBlock.name === 'kadence/rowlayout' && currentBlock.innerBlocks) {
                const sections = currentBlock.innerBlocks.filter(innerBlock => 
                  innerBlock.name === 'kadence/column' || innerBlock.name === 'kadence/section'
                );
                
                if (sections.length === 2) {
                  sections.forEach(section => {
                    const hasParagraph = section.innerBlocks && section.innerBlocks.some(innerBlock => 
                      innerBlock.name === 'core/paragraph'
                    );
                    
                    if (hasParagraph && section.innerBlocks) {
                      const firstBlock = section.innerBlocks[0];
                      if (!firstBlock || (firstBlock.name !== 'core/image' && firstBlock.name !== 'core/gallery')) {
                        const imageBlock = createBlock('core/image', {});
                        section.innerBlocks.unshift(imageBlock);
                      }
                    }
                  });
                }
              }
              
              // Process inner blocks recursively
              if (currentBlock.innerBlocks && currentBlock.innerBlocks.length > 0) {
                currentBlock.innerBlocks = processBlocks(currentBlock.innerBlocks);
              }
              
              processedBlocks.push(currentBlock);
              i++;
            }
            
            return processedBlocks;
          };

          // Process all blocks
          const processedBlocks = processBlocks(parsedBlocks);
          
          // Serialize back to HTML string
          return serializeBlocks(processedBlocks);
        }

        // Parse the HTML string to a DOM object
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        // --- Underline normalization (CSS/MSO -> <u> on phrasing) ---
        (function normalizeUnderline(doc){
          const PHRASING = new Set(['A','ABBR','B','BDI','BDO','BR','CITE','CODE','DATA','DFN','EM','I','IMG','KBD','MARK','Q','RB','RP','RT','RTC','RUBY','S','SAMP','SMALL','SPAN','STRONG','SUB','SUP','TIME','U','VAR','WBR']);
          const underlineRe = /\btext-decoration(?:-line)?\s*:\s*underline\b/i;
          const msoRe = /\bmso-(?:text-)?underline\s*:\s*single\b/i;
          const hasUnderline = (style) => underlineRe.test(style) || msoRe.test(style);

          function cleanStyle(style) {
            return style
              .replace(/text-decoration(?:-line)?\s*:\s*underline;?/gi, '')
              .replace(/mso-(?:text-)?underline\s*:\s*single;?/gi, '')
              .trim();
          }
          function wrapNodeWithU(node) {
            const u = doc.createElement('u');
            node.parentNode.insertBefore(u, node);
            u.appendChild(node);
          }
          function wrapTextInElement(el) {
            Array.from(el.childNodes).forEach((n) => {
              if (n.nodeType === Node.TEXT_NODE) {
                if (n.nodeValue && n.nodeValue.trim()) wrapNodeWithU(n);
              } else if (n.nodeType === Node.ELEMENT_NODE) {
                if (n.nodeName === 'U') return;
                if (PHRASING.has(n.nodeName)) wrapNodeWithU(n);
                else wrapTextInElement(n);
              }
            });
          }

          doc.querySelectorAll('[style]').forEach((el) => {
            const style = el.getAttribute('style') || '';
            if (!hasUnderline(style)) return;

            if (PHRASING.has(el.nodeName)) {
              if (!(el.childNodes.length === 1 && el.firstChild.nodeType === 1 && el.firstChild.nodeName === 'U')) {
                el.innerHTML = `<u>${el.innerHTML}</u>`;
              }
            } else {
              wrapTextInElement(el);
            }

            const cleaned = cleanStyle(style);
            if (cleaned) el.setAttribute('style', cleaned); else el.removeAttribute('style');
          });
        })(doc);
        // --- End Underline normalization ---
    

        // console.log(doc);

        // Remove all content before the <h1></h1> tag
        let articleStart = null;
        let articleStartImg = null;
        [...doc.querySelectorAll('h1')].some(h1 => {
          const headImg = h1.querySelectorAll('img');
          articleStart = h1;
          articleStartImg = headImg;
          return true;
        });

        if (articleStart) {
          
          const _nextEl = (articleStart && articleStart.nextElementSibling) ? articleStart.nextElementSibling : null;
          const _isNextTable = _nextEl && _nextEl.tagName && _nextEl.tagName.toLowerCase() === 'table';
          if (_isNextTable) {
            // do nothing; let heading converter handle later
          } else {
let previousSibling = articleStart.previousSibling;
          while (previousSibling) {
            const temp = previousSibling.previousSibling;
            previousSibling.remove();
            previousSibling = temp;
          }
          if (articleStartImg.length > 0) {
            if (articleStartImg.length > 1) {
              const headImgItems = Array.from(articleStartImg).map(img => {
                const columnUniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
                return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"${columnUniqueID}","borderStyle":[{"top":["","",""],"right":["","",""],"bottom":["","",""],"left":["","",""],"unit":"px"}]} -->
<div class="wp-block-kadence-column kadence-column${columnUniqueID}"><div class="kt-inside-inner-col"><!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image --></div></div>
<!-- /wp:kadence/column -->`;
              }).join('');
              const rowUniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
              articleStart.outerHTML = `<!-- wp:kadence/rowlayout {"uniqueID":"${rowUniqueID}","colLayout":"equal","kbVersion":2} -->${headImgItems}<!-- /wp:kadence/rowlayout -->`;
            } else {
              articleStart.outerHTML = `<!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image -->`;
            }
          } else {
            articleStart.remove(); // Remove the <h1></h1> itself
          }

          }
        }

        // Remove all content after the <p><strong>NOTE SEO Writer</strong></p> tag
        let noteSEOStart = null;
        doc.querySelectorAll('p').forEach(p => {
          const text = p.textContent.toLowerCase().trim();
          if (text === 'note seo writer') {
            noteSEOStart = p;
          }
        });

        if (noteSEOStart) {
          let nextSibling = noteSEOStart.nextSibling;
          while (nextSibling) {
            const temp = nextSibling.nextSibling;
            nextSibling.remove();
            nextSibling = temp;
          }
          noteSEOStart.remove(); // Remove the <p><strong>NOTE SEO Writer</strong></p> itself
        }

        // Find all <p> tags and modify them based on their content and child elements
        let checkReferences = false;
        doc.querySelectorAll('p').forEach((p) => {
          // --- Guard to avoid duplicate images above RowLayout (table) ---
          try {
            const imgsInP = p.querySelectorAll && p.querySelectorAll('img');
            if (imgsInP && imgsInP.length > 0) {
              let ne = p.nextSibling;
              while (ne && ne.nodeType === 3 && !(ne.textContent || '').trim()) ne = ne.nextSibling;
              const isNextTable = ne && ne.nodeType === 1 && ne.tagName && ne.tagName.toLowerCase() === 'table';
              if (isNextTable) { p.remove(); return; }
            }
          } catch (e) {}
          // --- End guard ---

          // Caption detection: if previous element is an image and this paragraph is italic -> center + caption-img
          try {
            const prev = p.previousElementSibling;
            const hasImgAbove = prev && ((prev.tagName && prev.tagName.toLowerCase() === 'figure' && prev.querySelector('img')) || (prev.querySelector && prev.querySelector('img')));
            const html = (p.innerHTML || '').trim();
            const isItalicPara = /<(em|i)(\s|>)/i.test(html) || /font-style\s*:\s*italic/i.test(p.getAttribute('style')||'');
            if (!p.closest('table') && hasImgAbove && isItalicPara) {
              p.outerHTML = `<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center caption-img">${html}</p><!-- /wp:paragraph -->`;
              return;
            }
          } catch (e) {}
    
          
          
          // Bold+Underline title above image => center it (skip tables). Allow up to 3 blank paragraphs in between.
          try {
            const htmlBU = (p.innerHTML || '').trim();
            const hasBold = /<(strong|b)(\s|>)/i.test(htmlBU) || /font-weight\s*:\s*(bold|[7-9]00)/i.test(p.getAttribute('style') || '') || /font-weight\s*:\s*(bold|[7-9]00)/i.test(htmlBU);
            const hasUnderlineTag = /<u(\s|>)/i.test(htmlBU);
            const hasUnderlineStyle = /text-decoration\s*:\s*underline/i.test(p.getAttribute('style') || '') || /text-decoration\s*:\s*underline/i.test(htmlBU);
            const hasUnderline = hasUnderlineTag || hasUnderlineStyle;

            // look ahead to next non-empty sibling (allow a few blanks)
            let hops2 = 0;
            let nextEl = p.nextElementSibling;
            const isBlankPara2 = (el) => {
              if (!el || !(el.tagName && el.tagName.toLowerCase() === 'p')) return false;
              const inner = (el.innerHTML || '').replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, ' ').trim();
              return inner === '';
            };
            while (nextEl && hops2 < 3 && isBlankPara2(nextEl)) {
              nextEl = nextEl.nextElementSibling;
              hops2++;
            }
            const hasImgBelow = nextEl && nextEl.querySelector && nextEl.querySelector('img');

            if (!p.closest('table') && hasBold && hasUnderline && hasImgBelow) {
              const html = (p.innerHTML || '').trim();
              p.outerHTML = `<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">${html}</p><!-- /wp:paragraph -->`;
              return;
            }
          } catch (e) {}
// Skip paragraphs inside tables to avoid duplicate images
          if (p.closest && p.closest('table')) { return; }
const tagImg = p.querySelectorAll('img');
          let textContent = p.textContent.trim();
          const startsWithQuote = textContent.startsWith('"') || textContent.startsWith('"');
          const endsWithQuote = textContent.endsWith('"') || textContent.endsWith('"');
          let textHtml = p.innerHTML.replace(/(?:h[1-6]|h [1-6]|header tag [1-6]|header tag[1-6]|header[1-6]|header [1-6]) ?/gi, '').trim();
          if (textHtml.startsWith(':')) {
            textHtml = textHtml.replace(':', '').trim();
          }

          if (textContent.startsWith('สารบัญ') || textContent.startsWith('คลิกอ่านหัวข้อ')) {
            p.outerHTML = `<!-- wp:paragraph {"className":"subtext-gtb"} --><p class="subtext-gtb">${textHtml}</p><!-- /wp:paragraph -->`;
          } else if ((!textContent && tagImg.length === 0) || textContent.match(/(^|\s)(alt\s*:\s*|alt\s+:\s*)/i) || textContent.startsWith('(alt') || textContent.startsWith('(Alt') || textContent.startsWith('(ALT')) {
            p.remove();
          } else if (textContent.startsWith('อ่านบทความเพิ่มเติม') || textContent.startsWith('อ่านเพิ่มเติม') || textContent.startsWith('คลิกอ่านเพิ่มเติม') || textContent.startsWith('คลิกอ่านบทความ') || textContent.startsWith('หมอได้สรุปข้อมูล')) {
            p.outerHTML = `<!-- wp:paragraph {"className":"vsq-readmore"} --><p class="vsq-readmore">${textHtml}</p><!-- /wp:paragraph -->`;
          } else if (textContent.replace(/(?:h[1-6]|h [1-6]|header tag [1-6]|header tag[1-6]|header[1-6]|header [1-6]) ?/gi, '').replace(':', '').trim().startsWith('สรุป')) {
            textHtml = textHtml.replace(/<\/?[^>]+(>|$)/g, '').replace(':', '').trim();
            p.outerHTML = `<!-- wp:paragraph {"className":"subtext-gtb"} --><p class="subtext-gtb">${textHtml}</p><!-- /wp:paragraph -->`;
          } else if (textContent.startsWith('อ้างอิง') || textContent.startsWith('เอกสารอ้างอิง') || textContent.startsWith('เอกสาร อ้างอิง') || textContent.startsWith('แหล่งข้อมูลอ้างอิง')) {
            p.outerHTML = `<!-- wp:separator --><hr class="wp-block-separator has-alpha-channel-opacity"/><!-- /wp:separator --><!-- wp:paragraph {"className":"references"} --><p class="references">${textHtml}</p><!-- /wp:paragraph -->`;
            checkReferences = true;
          } else if (textContent === 'บทความเจาะลึก' || textContent === 'บทความแนะนำ') {
            p.outerHTML = `<!-- wp:paragraph {"align":"center","className":"headline"} --><p class="has-text-align-center headline">${textHtml}</p><!-- /wp:paragraph -->`;
          } else if (textContent.startsWith('https://youtu.be') || textContent.startsWith('https://www.youtube') || textContent.startsWith('https://youtube')) {
            p.outerHTML = `<!-- wp:embed {"url":"${textContent}","type":"video","providerNameSlug":"youtube","responsive":true,"align":"center","className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} --><figure class="wp-block-embed aligncenter is-type-video is-provider-youtube wp-block-embed-youtube wp-embed-aspect-16-9 wp-has-aspect-ratio"><div class="wp-block-embed__wrapper">${textContent}</div></figure><!-- /wp:embed -->`;
          } else if (tagImg.length > 0) {
            // Check for Alt: text in the paragraph
            let altText = '';
            let captionText = '';
            const paragraphText = textContent.trim();
            
            // Enhanced Alt detection for "Alt:" and "Alt :" patterns in paragraphs
            const altMatch = paragraphText.match(/(^|\s)(alt\s*:\s*|alt\s+:\s*)([^\n\r]*)/i);
            if (altMatch) {
              altText = altMatch[3].trim();
              // Remove Alt: text from main content for caption detection
              const textWithoutAlt = paragraphText.replace(/(^|\s)(alt\s*:\s*|alt\s+:\s*)([^\n\r]*)/i, '').trim();
              
              // Check if remaining text should be treated as caption
              if (textWithoutAlt) {
                const isTextCentered = p.style.textAlign === 'center' || 
                                     p.getAttribute('align') === 'center' ||
                                     textHtml.includes('text-align: center') ||
                                     textHtml.includes('text-align:center') ||
                                     textHtml.includes('align="center"') ||
                                     p.classList.contains('center') ||
                                     textHtml.includes('class="center"');
                const isTextItalic = textHtml.includes('<em>') || 
                                    textHtml.includes('<i>') || 
                                    textHtml.includes('font-style: italic') ||
                                    textHtml.includes('font-style:italic') ||
                                    textHtml.includes('font-style : italic') ||
                                    p.querySelector('em') !== null ||
                                    p.querySelector('i') !== null;
                
                if (isTextCentered && isTextItalic) {
                  captionText = textWithoutAlt;
                }
              }
            } else if (paragraphText) {
              // Check if the text should be treated as a caption (centered and italic)
              const isTextCentered = p.style.textAlign === 'center' || 
                                   p.getAttribute('align') === 'center' ||
                                   textHtml.includes('text-align: center') ||
                                   textHtml.includes('text-align:center') ||
                                   textHtml.includes('align="center"') ||
                                   p.classList.contains('center') ||
                                   textHtml.includes('class="center"');
              const isTextItalic = textHtml.includes('<em>') || 
                                  textHtml.includes('<i>') || 
                                  textHtml.includes('font-style: italic') ||
                                  textHtml.includes('font-style:italic') ||
                                  textHtml.includes('font-style : italic') ||
                                  p.querySelector('em') !== null ||
                                  p.querySelector('i') !== null;
              
              if (isTextCentered && isTextItalic) {
                captionText = paragraphText;
              }
            }
            
            if (tagImg.length > 1) {
              // Remove all img tags from this paragraph first to prevent duplicate processing
              tagImg.forEach(img => img.remove());
              
              const newImgItems = Array.from(tagImg).map((img, imgIndex) => {
                const columnUniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
                let columnContent = `<!-- wp:image -->
<figure class="wp-block-image"><img alt="${altText}"/></figure>
<!-- /wp:image -->`;
                
                // Add caption only to the first image if there's caption text
                if (imgIndex === 0 && captionText) {
                  columnContent += `
<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">${captionText}</p>
<!-- /wp:paragraph -->`;
                }
                
                return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"${columnUniqueID}","borderStyle":[{"top":["","",""],"right":["","",""],"bottom":["","",""],"left":["","",""],"unit":"px"}]} -->
<div class="wp-block-kadence-column kadence-column${columnUniqueID}"><div class="kt-inside-inner-col">${columnContent}</div></div>
<!-- /wp:kadence/column -->`;
              }).join('');
              
              const rowUniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
              p.outerHTML = `<!-- wp:kadence/rowlayout {"uniqueID":"${rowUniqueID}","colLayout":"equal","kbVersion":2} -->${newImgItems}<!-- /wp:kadence/rowlayout -->`;
            } else {
              // Remove the img tag from this paragraph first to prevent duplicate processing
              tagImg.forEach(img => img.remove());
              
              let imageBlock = `<!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt="${altText}"/></figure><!-- /wp:image -->`;
              
              if (captionText) {
                imageBlock += `<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">${captionText}</p><!-- /wp:paragraph -->`;
              }
              
              p.outerHTML = imageBlock;
            }
          } else if (startsWithQuote && endsWithQuote) {
            textContent = textContent.slice(1, -1).trim();
            p.outerHTML = `<!-- wp:quote --><blockquote class="wp-block-quote"><!-- wp:paragraph --><p>${textContent}</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote -->`;
          } else if (textContent.startsWith('ข้อควรรู้')) {
            p.outerHTML = `<!-- wp:quote --><blockquote class="wp-block-quote"><!-- wp:paragraph --><p>${textContent}</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote -->`;
          } else if (textContent === 'แอด Line@ เพื่อรับโปรโมชั่น' || textContent === 'แอด Line@ เพื่อรับโปรโมชัน') {
            const hasLink = p.querySelector('a') !== null;
            if (hasLink) {
              const Link = p.querySelector('a').getAttribute('href');
              p.outerHTML = `<!-- wp:paragraph {"align":"center","className":"headline"} --><p class="has-text-align-center headline">${textContent}</p><!-- /wp:paragraph --><!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button {"className":"btn-addline"} --><div class="wp-block-button btn-addline"><a class="wp-block-button__link wp-element-button" href="${Link}">Add LINE</a></div><!-- /wp:button --></div><!-- /wp:buttons -->`;
            } else {
              p.outerHTML = `<!-- wp:paragraph {"align":"center","className":"headline"} --><p class="has-text-align-center headline">${textContent}</p><!-- /wp:paragraph --><!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} --><div class="wp-block-buttons"><!-- wp:button {"className":"btn-addline"} --><div class="wp-block-button btn-addline"><a class="wp-block-button__link wp-element-button">Add LINE</a></div><!-- /wp:button --></div><!-- /wp:buttons -->`;
            }
          } else {
            if (checkReferences) {
              p.outerHTML = `<!-- wp:paragraph {"className":"references"} --><p class="references">${textHtml}</p><!-- /wp:paragraph -->`;
            } else {
              p.outerHTML = `<!-- wp:paragraph --><p>${textHtml}</p><!-- /wp:paragraph -->`;
            }
          }
        });

        // Helper function to generate ID from text (used for both headings and menu links)
        const generateHashId = (text) => {
          return text
            .replace(/<\/?[^>]+(>|$)/g, '')  // Remove HTML tags first
            .toLowerCase()
            .replace(/\?/g, '')
            .replace(/\./g, '')
            .replace(/:/g, '')
            .replace(/—/g, '-')
            .replace(/–/g, '-')
            .replace(/&amp;/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\u0E00-\u0E7Fa-z0-9\-]/g, '');
        };

        // Remove <a> tags within headings
        doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
          heading.querySelectorAll('a').forEach(a => {
            const parent = a.parentNode;
            while (a.firstChild) parent.insertBefore(a.firstChild, a);
            parent.removeChild(a);
          });
        });

        // Convert heading tags to Gutenberg format
        doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading, index) => {
          const level = heading.tagName.toLowerCase();
          const levelNumber = level.match(/\d+/)[0];
          const headingContent = heading.innerHTML.trim();
          let headingText = headingContent.replace(/1st/gi, '').replace(/(?:h[1-6]|h [1-6]|header tag [1-6]|header tag[1-6]|header[1-6]|header [1-6]) ?/gi, '').trim();
          if (headingText.startsWith(':')) {
            headingText = headingText.replace(':', '').trim();
          }
          const hashTagId = generateHashId(headingText); 
          const tagImg = heading.querySelectorAll('img');
          const textOnly = headingText.replace(/<\/?[^>]+(>|$)/g, '');
          let blockSeparator = `<!-- wp:separator --><hr class="wp-block-separator has-alpha-channel-opacity"/><!-- /wp:separator -->`;
          let blockTarget = `<!-- wp:ps2id-block/target --><div class="wp-block-ps2id-block-target" id="${hashTagId}"></div><!-- /wp:ps2id-block/target -->`;
          let classBlock = `class="wp-block-heading"`;
          let attrLevel = ` {"level":${levelNumber}}`;
          if (level === 'h2') {
            attrLevel = '';
          }
          if (index === 0) {
            blockSeparator = '';
            blockTarget = '';
          }
          // console.log('TEXT: ' + textOnly + ' | IMG: ' + tagImg.length);
          // console.log('number: ' + index + ' | TEXT: ' + textOnly);

          let gutenbergHeading = '';
          // If the next element after this heading is a TABLE, skip creating image blocks from the heading
          const _nextElHeading = heading.nextElementSibling;
          const _isNextTableHeading = _nextElHeading && _nextElHeading.tagName && _nextElHeading.tagName.toLowerCase() === 'table';


          if (!textOnly && tagImg.length === 0) {
            heading.remove();
          } else {
            if (textOnly && tagImg.length > 0 && !_isNextTableHeading) {
              // Remove all img tags from this heading first to prevent duplicate processing
              tagImg.forEach(img => img.remove());
              
              if (tagImg.length > 1) {
                const newImgItems = Array.from(tagImg).map(img => {
                  const columnUniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
                  return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"${columnUniqueID}","borderStyle":[{"top":["","",""],"right":["","",""],"bottom":["","",""],"left":["","",""],"unit":"px"}]} -->
<div class="wp-block-kadence-column kadence-column${columnUniqueID}"><div class="kt-inside-inner-col"><!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image --></div></div>
<!-- /wp:kadence/column -->`;
                }).join('');
                const rowUniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
                gutenbergHeading = `${blockSeparator}${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading --><!-- wp:kadence/rowlayout {"uniqueID":"${rowUniqueID}","colLayout":"equal","kbVersion":2} -->${newImgItems}<!-- /wp:kadence/rowlayout -->`;
              } else {
                gutenbergHeading = `${blockSeparator}${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading --><!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image -->`;
              }
            } else if (!textOnly && tagImg.length > 0 && !_isNextTableHeading) {
              // Remove all img tags from this heading first to prevent duplicate processing
              tagImg.forEach(img => img.remove());
              
              if (tagImg.length > 1) {
                const newImgItems = Array.from(tagImg).map(img => {
                  const columnUniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
                  return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"${columnUniqueID}","borderStyle":[{"top":["","",""],"right":["","",""],"bottom":["","",""],"left":["","",""],"unit":"px"}]} -->
<div class="wp-block-kadence-column kadence-column${columnUniqueID}"><div class="kt-inside-inner-col"><!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image --></div></div>
<!-- /wp:kadence/column -->`;
                }).join('');
                const rowUniqueID = `70684_${Math.random().toString(36).substr(2, 9)}`;
                gutenbergHeading = `<!-- wp:kadence/rowlayout {"uniqueID":"${rowUniqueID}","colLayout":"equal","kbVersion":2} -->${newImgItems}<!-- /wp:kadence/rowlayout -->`;
              } else {
                gutenbergHeading = `<!-- wp:image {"align":"center"} --><figure class="wp-block-image aligncenter"><img alt=""/></figure><!-- /wp:image -->`;
              }
            } else {
              if (textOnly.startsWith('Q&A') || textOnly.startsWith('Q&amp;A') || textOnly.startsWith('คำถามที่พบบ่อย')) {
                if (level === 'h2') {
                  attrLevel = ` {"textAlign":"center","className":"label-heading"}`;
                } else {
                  attrLevel = ` {"textAlign":"center","level":${levelNumber},"className":"label-heading"}`;
                }
                classBlock = `class="wp-block-heading has-text-align-center label-heading"`;
              } else if (textOnly === 'สรุป') {
                if (level === 'h2') {
                  attrLevel = ` {"className":"subtext-gtb"}`;
                  classBlock = `class="wp-block-heading subtext-gtb"`;
                }
              }


              if (level === 'h2') {
                gutenbergHeading = `${blockSeparator}${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading -->`;
              } else if (level === 'h4' || level === 'h5' || level === 'h6') {
                gutenbergHeading = `<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading -->`;
              } else {
                if (textOnly === 'สรุป') {
                  gutenbergHeading = `${blockSeparator}${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading -->`;
                } else {
                  gutenbergHeading = `${blockTarget}<!-- wp:heading${attrLevel} --><${level} ${classBlock}>${textOnly}</${level}><!-- /wp:heading -->`;
                }
              }
            }

            heading.outerHTML = gutenbergHeading;
          }
        });



        // (Function createRowLayoutFromContent moved above to be called before DOM parsing)
        

        // Cleanup: remove images accidentally embedded inside headings (keep other images)
        doc.querySelectorAll('h1 img, h2 img, h3 img, h4 img, h5 img, h6 img').forEach(img => { img.remove(); });
function convertSubListToGutenberg(ul, tag, classPrev) {
          let tagComment = '<!-- wp:list -->';
          if (classPrev === 'references') {
            tagComment = '<!-- wp:list {"className":"references"} -->';
          }
          if(tag === 'ol') {
            tagComment = '<!-- wp:list {"ordered":true} -->';
            if (classPrev === 'references') {
              tagComment = '<!-- wp:list {"ordered":true,"className":"references"} -->';
            }
          }
          const newListItems = Array.from(ul.querySelectorAll('li')).map(li => {
            return `<!-- wp:list-item --><li>${li.innerHTML}</li><!-- /wp:list-item -->`;
          }).join('');
          return `${tagComment}<${tag}>${newListItems}</${tag}><!-- /wp:list -->`;
        }

        function convertListToGutenberg(ul, tag, classPrev) {
          let tagComment = '<!-- wp:list -->';
          if (classPrev === 'references') {
            tagComment = '<!-- wp:list {"className":"references"} -->';
          }
          if(tag === 'ol') {
            tagComment = '<!-- wp:list {"ordered":true} -->';
            if (classPrev === 'references') {
              tagComment = '<!-- wp:list {"ordered":true,"className":"references"} -->';
            }
          }
          const listItems = Array.from(ul.children).map(li => {
            const nestedUl = li.querySelector('ul');
            if (nestedUl) {
              const listSubItems = convertSubListToGutenberg(nestedUl, tag);
              nestedUl.remove();
              return `<!-- wp:list-item --><li>${li.innerHTML}${listSubItems}</li><!-- /wp:list-item -->`;
            }
            return `<!-- wp:list-item --><li>${li.innerHTML}</li><!-- /wp:list-item -->`;
          }).join('');
          return `${tagComment}<${tag}>${listItems}</${tag}><!-- /wp:list -->`;
        }

        function convertSubListToMenu(ul, tag) {
          let tagComment = '<!-- wp:list -->';
          if(tag === 'ol') {
            tagComment = '<!-- wp:list {"ordered":true} -->';
          }
          const newListItems = Array.from(ul.children).map(li => {
            let liContent = li.innerHTML;
            const aTag = li.querySelector('a');
            if (aTag) {
              const linkText = aTag.textContent || '';
              const newHref = generateHashId(linkText);
              liContent = liContent.replace(/href="[^"]*"/, `href="#${newHref}"`);
            }
            return `<!-- wp:list-item --><li>${liContent}</li><!-- /wp:list-item -->`;
          }).join('');
          return `${tagComment}<${tag}>${newListItems}</${tag}><!-- /wp:list -->`;
        }

        function convertListToMenu(ul, tag) {
          let tagComment = '<!-- wp:list -->';
          if(tag === 'ol') {
            tagComment = '<!-- wp:list {"ordered":true} -->';
          }
          const listItems = Array.from(ul.children).map(li => {
            const nestedUl = li.querySelector('ul');
            const aTag = li.querySelector('a');
            
            if (nestedUl) {
              // Process nested list first
              const listSubItems = convertSubListToMenu(nestedUl, tag);
              // Remove nested ul from li temporarily
              nestedUl.remove();
              // Now get content and fix link
              let liContent = li.innerHTML;
              if (aTag && aTag.textContent) {
                const linkText = aTag.textContent;
                const newHref = generateHashId(linkText);
                liContent = liContent.replace(/href="[^"]*"/, `href="#${newHref}"`);
              }
              return `<!-- wp:list-item --><li>${liContent}${listSubItems}</li><!-- /wp:list-item -->`;
            } else {
              // No nested list, just process link
              let liContent = li.innerHTML;
              if (aTag && aTag.textContent) {
                const linkText = aTag.textContent;
                const newHref = generateHashId(linkText);
                liContent = liContent.replace(/href="[^"]*"/, `href="#${newHref}"`);
              }
              return `<!-- wp:list-item --><li>${liContent}</li><!-- /wp:list-item -->`;
            }
          }).join('');
          return `${tagComment}<${tag}>${listItems}</${tag}><!-- /wp:list -->`;
        }

        // Convert all <ul> and <ol> elements with a combined counter to add class to the first found
        // let firstListProcessed = false;
        doc.querySelectorAll('ul, ol').forEach((list, index) => {
          let listHTML = '';
          const tag = list.tagName.toLowerCase();
          const previousElement = list.previousElementSibling;
          // if (!firstListProcessed) {
          if (index === 0) {
            listHTML = convertListToMenu(list, tag);
            // firstListProcessed = true;
          } else {
            if (previousElement && previousElement.classList.contains('references')) {
              const className = previousElement.className;
              // console.log('Class name:', className);
              listHTML = convertListToGutenberg(list, tag, className);
              listHTML = listHTML.replace(`<${tag}>`, `<${tag} class="references">`);
            } else {
              listHTML = convertListToGutenberg(list, tag, null);
            }
          }
          list.innerHTML = listHTML;
          const parentList = list.closest(tag);
          if (parentList) {
            parentList.replaceWith(...parentList.childNodes);
          }
        });

        // Convert all <table> elements to a single Kadence RowLayout (2 columns: image above paragraph)
        doc.querySelectorAll('table').forEach((table) => {
          // --- Guard: only convert tables that actually contain images ---
          const ROWLAYOUT_MIN_IMAGES = 2; // expect two image sections
          const imgCountInTable = table.querySelectorAll('img').length;

          // If this is a text-only table (or has < 2 images), keep it as a normal table
          if (imgCountInTable < ROWLAYOUT_MIN_IMAGES) {
            return; // Gutenberg will keep/auto-convert it to a Table block
          }
          // --- end guard ---

          const rows = Array.from(table.querySelectorAll('tr'));
          if (!rows.length) { table.remove(); return; }
          // choose reference row with most cells
          let baseRow = rows[0], maxCells = 0;
          rows.forEach(r => { const c = r.querySelectorAll('th,td').length; if (c>maxCells) { maxCells=c; baseRow=r; } });
          const cells = Array.from(baseRow.querySelectorAll('th,td')).slice(0, 2);
          if (cells.length < 2) { table.remove(); return; }

          const makeCol = (cell) => {
            const columnUniqueID = `70684_${Math.random().toString(36).slice(2, 11)}`;
            const imgEl = cell.querySelector('img');
            const innerHTML = cell.innerHTML || '';
            let text = (cell.textContent || '').trim();

            // Alt: detection
            let altText = '';
            const altMatch = text.match(/(?:^|\s)alt\s*:\s*([^\n\r]+)/i);
            if (altMatch) { altText = (altMatch[1] || '').trim(); text = text.replace(altMatch[0], '').trim(); }

            const isCentered = (cell.style && cell.style.textAlign === 'center') ||
                               (cell.getAttribute && cell.getAttribute('align') === 'center') ||
                               /text-align\s*:\s*center/i.test(innerHTML) ||
                               /class=\"[^\"]*has-text-align-center[^\"]*\"/i.test(innerHTML);
            const isItalic = /<em|<i|font-style\s*:\s*italic/i.test(innerHTML);

            const paraBody = isItalic ? `<em>${text}</em>` : text;
            const forceCenter = isItalic || isCentered;
            const alignAttr = forceCenter ? ' {"align":"center"}' : '';
            const classAttr = forceCenter ? ' class="has-text-align-center caption-img"' : '';

            const src = (imgEl && imgEl.getAttribute('src') && !WP_EXPORT_MODE)
              ? ` src="${imgEl.getAttribute('src')}"` : '';

            const imageHTML = `<!-- wp:image -->
<figure class="wp-block-image"><img${src} alt="${altText}"/></figure>
<!-- /wp:image -->`;

            const paraHTML = `<!-- wp:paragraph${alignAttr} -->
<p${classAttr}>${paraBody}</p>
<!-- /wp:paragraph -->`;

            return `<!-- wp:kadence/column {"borderWidth":["","","",""],"uniqueID":"${columnUniqueID}","borderStyle":[{"top":["","",""],"right":["","",""],"bottom":["","",""],"left":["","",""],"unit":"px"}]} -->
<div class="wp-block-kadence-column kadence-column${columnUniqueID}"><div class="kt-inside-inner-col">
${imageHTML}
${paraHTML}
</div></div>
<!-- /wp:kadence/column -->`;
          };

          const rowUniqueID = `70684_${Math.random().toString(36).slice(2, 11)}`;
          const columnsHTML = cells.map(makeCol).join('\n\n');
          const rowLayoutHTML = `<!-- wp:kadence/rowlayout {"uniqueID":"${rowUniqueID}","colLayout":"equal","kbVersion":2} -->
${columnsHTML}
<!-- /wp:kadence/rowlayout -->`;
          table.outerHTML = rowLayoutHTML;
        });

        // For WP export: strip any remaining base64 data URIs
        if (typeof WP_EXPORT_MODE !== 'undefined' && WP_EXPORT_MODE) {
          htmlString = htmlString.replace(/src="data:[^"]*"/g, 'src=""');
        }
// Serialize the DOM back to a string
        htmlString = new XMLSerializer().serializeToString(doc);

        // Remove the <html>, <head>, and <body> tags from the string
        htmlString = htmlString.replace(/<html[^>]*>/, '').replace('</html>', '');
        htmlString = htmlString.replace('<head></head>', '');
        htmlString = htmlString.replace(/<body[^>]*>/, '').replace('</body>', '');

        // Remove extra spaces or tabs to ensure only one space between words
        // htmlString = htmlString.replace(/\s+/g, ' ');

        // Add new lines after closing tags for readability
        htmlString = htmlString.replace(/<!--/g, '\n<!--');
        htmlString = htmlString.replace(/-->/g, '-->\n');
        htmlString = htmlString.replace(/𝗖𝗼𝗼𝗹 𝗬𝗮𝗴 𝟭𝟬𝟲𝟰/g, 'Cool Yag 1064');

        // Apply post-processing to create row layouts (DISABLED temporarily)
        // htmlString = createRowLayoutFromContent(htmlString);
        
        // === Force inline underline style on <u> and .underline (final safety) ===
        (function forceUnderlineStyle(){
          const parser3 = new DOMParser();
          const doc3 = parser3.parseFromString(htmlString, 'text/html');
          doc3.querySelectorAll('u').forEach((uEl) => {
            const existing = (uEl.getAttribute('style') || '').trim();
            const base = 'text-decoration: underline;';
            uEl.setAttribute('style', existing ? (existing.endsWith(';') ? existing : existing + '; ') + base : base);
          });
          doc3.querySelectorAll('.underline').forEach((el) => {
            const existing = (el.getAttribute('style') || '').trim();
            const base = 'text-decoration: underline;';
            el.setAttribute('style', existing ? (existing.endsWith(';') ? existing : existing + '; ') + base : base);
            el.classList.remove('underline');
            if (!el.getAttribute('class')) el.removeAttribute('class');
          });
          htmlString = new XMLSerializer().serializeToString(doc3)
            .replace(/<html[^>]*>/, '').replace('</html>', '')
            .replace('<head></head>', '')
            .replace(/<body[^>]*>/, '').replace('</body>', '');
        })();
        // === End force underline style ===

            setHtmlContent(htmlString.trim());
      } catch (error) {
        console.error('Conversion error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Docx to Gutenberg Code App</title>
        <meta name="description" content="Docx to Gutenberg Code App" />
      </Helmet>
      <div className="container">
        <div className="site-content">
          <div className="col-left">
            <div className="space-left">
              <h1>Docx to <span>Gutenberg</span> Converter</h1>
              <div className="upload-file">
                <input type="file" accept=".docx" onChange={handleFileChange} />
                <div className={`upload-file-btn ${file ? 'active' : ''}`}>
                  <div className="upload-file-icon">
                    <FontAwesomeIcon icon={faFileArrowUp} />
                  </div>
                  <div className="upload-file-detail">
                    <span className="upload-file-label"><strong>Click to upload</strong> or drag and drop<br />DOCX are Allowed.</span>
                  </div>
                </div>
              </div>
              {isLoading ? (
                <button className="submit-btn loading" onClick={handleConvert}>
                  LOADING...
                  <FontAwesomeIcon icon={faCircleNotch} spin />
                </button>
              ) : (
                <button className={`submit-btn ${file ? '' : 'disable'}`} onClick={handleConvert}>
                  CONVERT
                  <FontAwesomeIcon icon={faFileImport} />
                </button>
              )}
              <div className="upload-desc">
                <p>for websites :</p>
                <ul>
                  <li>vsquareclinic.com</li>
                  <li>vsqclinic.com</li>
                  <li>vsquareconsult.com</li>
                  <li>vsquare-under-eye.com</li>
                  <li>vsquareclinic.co</li>
                  <li>vsq-injector.com</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-right">
            <div className="space-right">
              <div className="code-content">
                <SyntaxHighlighter language="javascript" style={vscDarkPlus} className="syntax-highlighter" showLineNumbers>
                  {htmlContent}
                </SyntaxHighlighter>
                <button onClick={handleCopy} className="copy-btn">
                  <FontAwesomeIcon icon={faCopy} />
                  {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HelmetProvider>
  );
}

export default Home;