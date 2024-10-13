(function() {
    const vscode = acquireVsCodeApi();

    let codeMap;

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateCodeMap':
                codeMap = message.codeMap;
                renderCodeMap();
                break;
        }
    });

    function renderCodeMap() {
        d3.select('#codeMap').selectAll('*').remove();

        const margin = {top: 20, right: 90, bottom: 30, left: 90};
        const width = window.innerWidth - margin.left - margin.right;
        const height = window.innerHeight - margin.top - margin.bottom;

        const svg = d3.select('#codeMap')
            .append('svg')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        const treeLayout = d3.tree().size([height, width]);

        const root = d3.hierarchy(codeMap);
        const treeData = treeLayout(root);

        const link = svg.selectAll('.link')
            .data(treeData.links())
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        const node = svg.selectAll('.node')
            .data(treeData.descendants())
            .enter().append('g')
            .attr('class', d => 'node' + (d.children ? ' node--internal' : ' node--leaf'))
            .attr('transform', d => `translate(${d.y},${d.x})`);

        node.append('circle')
            .attr('r', 5)
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html(getTooltipContent(d.data))
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function(d) {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        node.append('text')
            .attr('dy', '.35em')
            .attr('x', d => d.children ? -13 : 13)
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.name);

        // Zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('zoom', (event) => {
                svg.attr('transform', event.transform);
            });

        d3.select('svg').call(zoom);
    }

    function getTooltipContent(data) {
        let content = `<strong>${data.name}</strong><br>Type: ${data.type}`;
        if (data.type === 'file') {
            if (data.imports && data.imports.length) {
                content += `<br>Imports: ${data.imports.join(', ')}`;
            }
            if (data.exports && data.exports.length) {
                content += `<br>Exports: ${data.exports.join(', ')}`;
            }
            if (data.functions && data.functions.length) {
                content += `<br>Functions: ${data.functions.join(', ')}`;
            }
            if (data.classes && data.classes.length) {
                content += `<br>Classes: ${data.classes.join(', ')}`;
            }
        }
        return content;
    }

    // Initial render
    if (codeMap) {
        renderCodeMap();
    }

    // Handle window resizing
    window.addEventListener('resize', () => {
        if (codeMap) {
            renderCodeMap();
        }
    });
})();