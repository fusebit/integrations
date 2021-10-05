module.exports = `
<style>

.markdown-body {
    --markdown-text: #333;
    --markdown-title: var(--markdown-title-weight);
    --markdown-line-height: 2;
}

.markdown-body a[href]
{
    color: red;
}

.markdown-body h2~h3+ul, .markdown-body h4+ul {
    background: var(--lightGray);
    border: var(--border-width) solid rgba(0,0,0,.1);
    cursor: default;
    display: -webkit-box;
    border-radius: var(--border-radius-lg);
    display: flex;
    display: -ms-flexbox;
    -webkit-box-direction: normal;
    -webkit-box-orient: vertical;
    -ms-flex-direction: column;
    flex-direction: column;
    overflow: hidden;
    font-size: 14px;
    padding-left:1em;
    list-style:none;
}

.markdown-body h2~h3+ul li:not(:last-child), h4+ul li:not(:last-child) {
    border-bottom: solid 1px var(--chalk);
}



.markdown-body span[class='cm-s-neo'] {
    color: var(--purple);
    font-weight: bold;
}

.markdown-body code span[class='cm-s-neo'] {
    font-weight: lighter;
}

.markdown-body ul+p, .markdown-body ul+pre+p,  .markdown-body h3+pre+p {
    background: var(--lightGray);
    border-radius: var(--border-radius-lg);
    border: var(--border-width) solid rgba(0,0,0,.1);
    cursor: default;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    font-size: 14px;
    overflow: hidden;
    list-style:none;
    padding-left:1em;
}

</style>
`;
