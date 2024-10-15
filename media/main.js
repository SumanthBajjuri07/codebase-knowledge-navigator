(function() {
    const vscode = acquireVsCodeApi();

    let codeMap;
    let svg, g, zoom;

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

        const margin = {top: 40, right: 120, bottom: 40, left: 120};
        const width = window.innerWidth - margin.left - margin.right;
        const height = window.innerHeight - margin.top - margin.bottom;

        svg = d3.select('#codeMap')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width + margin.right + margin.left} ${height + margin.top + margin.bottom}`);

        g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        const root = d3.hierarchy(codeMap);

        const treeLayout = d3.tree()
            .size([height, width])
            .nodeSize([60, 350]); // Increased node spacing

        treeLayout(root);

        // Use force simulation to prevent node overlap
        const simulation = d3.forceSimulation(root.descendants())
            .force('x', d3.forceX(d => d.y).strength(0.1))
            .force('y', d3.forceY(d => d.x).strength(0.1))
            .force('collision', d3.forceCollide().radius(50))
            .force('siblings', siblingForce())
            .stop();

        // Run the simulation
        for (let i = 0; i < 300; ++i) simulation.tick();

        // Custom force to push siblings apart
        function siblingForce() {
            return function(alpha) {
                root.each(function(d) {
                    if (d.parent) {
                        const siblings = d.parent.children;
                        siblings.forEach(function(sibling) {
                            if (sibling !== d) {
                                const dy = d.x - sibling.x;
                                const dx = d.y - sibling.y;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                if (distance < 100) {
                                    d.x += dy * alpha * 0.1;
                                    d.y += dx * alpha * 0.1;
                                    sibling.x -= dy * alpha * 0.1;
                                    sibling.y -= dx * alpha * 0.1;
                                }
                            }
                        });
                    }
                });
            };
        }

        // Declare a color scale
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Links
        const link = g.selectAll('.link')
            .data(root.links())
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        // Nodes
        const node = g.selectAll('.node')
            .data(root.descendants())
            .enter().append('g')
            .attr('class', d => 'node' + (d.children ? ' node--internal' : ' node--leaf'))
            .attr('transform', d => `translate(${d.y},${d.x})`);

        node.append('circle')
            .attr('r', 5)
            .style('fill', d => color(d.depth));

        node.append('text')
            .attr('dy', '.35em')
            .attr('x', d => d.children ? -13 : 13)
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .text(d => d.data.name)
            .style('fill', d => color(d.depth));

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        node.on('mouseover', function(event, d) {
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

        // Zoom controls
        d3.select('#zoomIn').on('click', () => {
            zoom.scaleBy(svg.transition().duration(750), 1.2);
        });

        d3.select('#zoomOut').on('click', () => {
            zoom.scaleBy(svg.transition().duration(750), 0.8);
        });

        d3.select('#resetZoom').on('click', () => {
            fitToFrame();
        });

        // Fit to frame function
        function fitToFrame() {
            const bounds = g.node().getBBox();
            const fullWidth = width + margin.left + margin.right;
            const fullHeight = height + margin.top + margin.bottom;
            const scale = 0.95 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
            const transform = d3.zoomIdentity
                .translate(fullWidth / 2 - scale * (bounds.x + bounds.width / 2), fullHeight / 2 - scale * (bounds.y + bounds.height / 2))
                .scale(scale);
            svg.transition().duration(750).call(zoom.transform, transform);
        }

        // Initial fit to frame
        fitToFrame();
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