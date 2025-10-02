import React, { useState } from 'react';
import mammoth from 'mammoth';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowUp, faFileImport, faCopy, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import ImgMockup from '../assets/images/img-mockup.jpg';

function Content() {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleFileChange = (event) => {
    const fileTarget = event.target.files[0];
    const fileLabel = document.querySelector('.upload-file-label');
    if (fileTarget) {
      setFile(fileTarget);
      fileLabel.textContent = fileTarget.name;
    } else {
      setFile(null);
      fileLabel.textContent = 'Please select .docx file';
    }
  };

  const handleCopy = () => {
    const contentDetail = document.querySelector('.content-detail');
    if (contentDetail) {
      const range = document.createRange();
      range.selectNodeContents(contentDetail);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      try {
        document.execCommand('copy');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }

      selection.removeAllRanges();
    }
  };

  const handleConvert = async () => {
    setIsLoading(true);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result;
      try {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        let htmlString = result.value;

        // Parse the HTML string to a DOM object
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        if (process.env.NODE_ENV === 'development') {
          console.log(doc);
        }

        // Remove all content before the <p><strong>THE ARTICLE</strong></p> tag
        let articleStart = null;
        doc.querySelectorAll('p').forEach(p => {
          if (p.innerHTML === '<strong>THE ARTICLE</strong>') {
            articleStart = p;
          }
        });

        if (articleStart) {
          let previousSibling = articleStart.previousSibling;
          while (previousSibling) {
            const temp = previousSibling.previousSibling;
            previousSibling.remove();
            previousSibling = temp;
          }
          articleStart.remove(); // Remove the <p><strong>THE ARTICLE</strong></p> itself
        }

        // Remove all content after the <p><strong>NOTE SEO Writer</strong></p> tag
        let noteSEOStart = null;
        doc.querySelectorAll('p').forEach(p => {
          if (p.innerHTML === '<strong>NOTE SEO Writer</strong>' || p.innerHTML === '<strong>NOTE SEO Writer </strong>') {
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

        // Find all <p> tags and modify <a> tags them based on their content and child elements
        doc.querySelectorAll('p').forEach(p => {
          let textContent = p.textContent.trim();
          p.querySelectorAll('a').forEach(a => {
            if (textContent.startsWith('สารบัญ') || textContent.startsWith('คลิกอ่านหัวข้อ')) {
              const text = a.textContent;
              const bbcode = text;
              a.outerHTML = bbcode;
            }
          });
        });

        // Find all <p> tags and modify them based on their content and child elements
        doc.querySelectorAll('p').forEach(p => {
          const tagImg = p.querySelectorAll('img');
          let textContent = p.textContent.trim();

          if ((!textContent && tagImg.length === 0) || textContent.startsWith('alt') || textContent.startsWith('Alt') || textContent.startsWith('ALT')) {
            p.remove();
          } else if (tagImg.length > 0) {
            if (tagImg.length > 1) {
              const newImgItems = Array.from(tagImg).map(img => {
                return `<img src="${ImgMockup}" />`;
              }).join('');
              p.outerHTML = newImgItems;
            } else {
              p.outerHTML = `<img src="${ImgMockup}" />`;
            }
          } else {
            p.outerHTML = `<p>${p.innerHTML}</p>`;
          }
        });

        // Remove <a> tags within headings
        doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
          heading.querySelectorAll('a').forEach(a => {
            const parent = a.parentNode;
            while (a.firstChild) parent.insertBefore(a.firstChild, a);
            parent.removeChild(a);
          });
        });

        // Convert heading tags to Gutenberg format
        doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
          const level = heading.tagName.toLowerCase();
          const levelNumber = level.match(/\d+/)[0];
          const headingContent = heading.innerHTML;
          const headingText = headingContent.replace(new RegExp(level, 'g'), '').replace('header tag ' + levelNumber, '').replace('header tag' + levelNumber, '').replace('Header Tag ' + levelNumber, '').replace('Header Tag' + levelNumber, '').replace('header ' + levelNumber, '').replace('header' + levelNumber, '').replace('Header ' + levelNumber, '').replace('Header' + levelNumber, '').replace('H' + levelNumber, '').replace('1st', '').replace(':', '').trim();
          const tagImg = heading.querySelector('img');
          const textOnly = headingText.replace(/<\/?[^>]+(>|$)/g, '');

          let gutenbergHeading = '';

          if (textOnly && tagImg) {
            gutenbergHeading = `<${level}>${textOnly}</${level}><img src="${ImgMockup}" />`;
          } else if (tagImg ) {
            gutenbergHeading = `<img src="${ImgMockup}" />`;
          } else {
            gutenbergHeading = `<${level}>${headingText}</${level}>`;
          }

          heading.outerHTML = gutenbergHeading;
        });

        function convertSubListToGutenberg(ul, tag) {
          const newListItems = Array.from(ul.querySelectorAll('li')).map(li => {
            return `<p>ㅤㅤ- ${li.innerHTML}</p>`;
          }).join('');
          return `${newListItems}`;
        }

        function convertListToGutenberg(ul, tag) {
          const listItems = Array.from(ul.children).map(li => {
            const nestedUl = li.querySelector('ul');
            if (nestedUl) {
              const listSubItems = convertSubListToGutenberg(nestedUl, tag);
              nestedUl.remove();
              return `<p>- ${li.innerHTML}${listSubItems}</p>`;
            }
            return `<p>- ${li.innerHTML}</p>`;
          }).join('');
          return `${listItems}`;
        }

        function convertSubListToMenu(ul, tag) {
          const newListItems = Array.from(ul.querySelectorAll('li')).map(li => {
            const liText = li.textContent.replace(/H2|H3|h2|h3|Header Tag 2|Header Tag 3|Header Tag2|Header Tag3|header tag 2|header tag 3|header tag2|header tag3|:/g, '').trim();
            return `<p>ㅤㅤ- ${liText}</p>`;
          }).join('');
          return `${newListItems}`;
        }

        function convertListToMenu(ul, tag) {
          const listItems = Array.from(ul.children).map(li => {
            const liText = li.textContent.replace(/H2|H3|h2|h3|Header Tag 2|Header Tag 3|Header Tag2|Header Tag3|header tag 2|header tag 3|header tag2|header tag3|:/g, '').trim();
            const nestedUl = li.querySelector('ul');
            if (nestedUl) {
              const listSubItems = convertSubListToMenu(nestedUl, tag);
              nestedUl.remove();
              const liSubText = li.textContent.replace(/H2|H3|h2|h3|Header Tag 2|Header Tag 3|Header Tag2|Header Tag3|header tag 2|header tag 3|header tag2|header tag3|:/g, '').trim();
              return `- ${liSubText}${listSubItems}`;
            }
            return `<p>- ${liText}</p>`;
          }).join('');
          return `${listItems}`;
        }

        // Convert all <ul> and <ol> elements with a combined counter to add class to the first found
        let firstListProcessed = false;
        doc.querySelectorAll('ul, ol').forEach((list, index) => {
          let listHTML = '';
          const tag = list.tagName.toLowerCase();
          if (!firstListProcessed) {
            listHTML = convertListToMenu(list, tag);
            firstListProcessed = true;
          } else {
            listHTML = convertListToGutenberg(list, tag);
          }
          list.innerHTML = listHTML;
          const parentList = list.closest(tag);
          if (parentList) {
            parentList.replaceWith(...parentList.childNodes);
          }
        });

        function convertTableToGutenberg(table) {
          const rows = Array.from(table.querySelectorAll('tr'));
          const headerCells = Array.from(rows.shift().querySelectorAll('th')).map(cell => {
            const cellContent = cell.textContent.trim();
            return `<td>${cellContent}</td>`;
          }).join('');
          
          const thead = `<tr>${headerCells}</tr>`;
        
          const bodyRows = rows.map(tr => {
            const cells = Array.from(tr.querySelectorAll('th, td')).map(cell => {
              const cellTag = 'td';
              const cellContent = cell.textContent.trim();
              return `<${cellTag}>${cellContent}</${cellTag}>`;
            }).join('');
            return `<tr>${cells}</tr>`;
          }).join('');
          
          let tbody = '';
          if(bodyRows) {
            tbody = `${bodyRows}`;
          }
        
          return `<table>${thead}${tbody}</table>`;
        }

        // Convert all <table> elements
        doc.querySelectorAll('table').forEach(table => {
          const tableHTML = convertTableToGutenberg(table);
          table.outerHTML = tableHTML;
        });

        // Serialize the DOM back to a string
        htmlString = new XMLSerializer().serializeToString(doc);

        // Remove the <html>, <head>, and <body> tags from the string
        htmlString = htmlString.replace(/<html[^>]*>/, '').replace('</html>', '');
        htmlString = htmlString.replace('<head></head>', '');
        htmlString = htmlString.replace(/<body[^>]*>/, '').replace('</body>', '');

        // Remove extra spaces or tabs to ensure only one space between words
        htmlString = htmlString.replace(/\s+/g, ' ');

        htmlString = htmlString.replace(/<br \/>/g, ' \n');
        htmlString = htmlString.replace(/<strong>/g, '<b>');
        htmlString = htmlString.replace(/<\/strong>/g, '</b>');
        htmlString = htmlString.replace(/𝗖𝗼𝗼𝗹 𝗬𝗮𝗴 𝟭𝟬𝟲𝟰/g, 'Cool Yag 1064');

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
        <title>Docx to Content App</title>
        <meta name="description" content="Docx to Content App" />
      </Helmet>
      <div className="container">
        <div className="site-content">
          <div className="col-left">
            <div className="space-left">
              <h1>Docx to <span>Content</span> Converter</h1>
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
                  <li>minimore.com</li>
                  <li>maggang.com</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-right">
            <div className="space-right">
              <div className="code-content">
                <div className="content-detail">
                  <div className="content-wrapper" dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
                </div>
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

export default Content;