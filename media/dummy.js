(function() {
    const vscode = acquireVsCodeApi();

    let codeMap;
    let svg, g, zoom;
    let nodes, links;
    let searchQuery = '';
    let searchResults = [];
    let currentSearchIndex = -1;

    // Color scale for depth-based coloring
    const colorScale = d3.scaleOrdinal()
        .domain([0, 1, 2, 3, 4, 5])
        .range(['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308']);

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateCodeMap':
                codeMap = message.codeMap;
                renderCodeMap();
                break;
            case 'themeChanged':
                updateSearchBoxTheme(message.theme);
                break;
        }
    });

    function createSearchBox() {
        const searchContainer = d3.select('body')
            .append('div')
            .attr('class', 'search-container')
            .style('position', 'fixed')
            .style('top', '10px')
            .style('right', '10px')
            .style('z-index', '1000')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '5px');

        const searchBox = searchContainer
            .append('input')
            .attr('type', 'text')
            .attr('id', 'searchBox')
            .attr('placeholder', 'Search files...')
            .style('padding', '5px 10px')
            .style('border-radius', '4px')
            .style('border', '1px solid #ccc')
            .style('outline', 'none');

        const matchCount = searchContainer
            .append('span')
            .attr('id', 'matchCount')
            .style('margin-left', '10px')
            .style('font-size', '12px');

        return searchBox;
    }

    function updateSearchBoxTheme(theme) {
        const searchBox = d3.select('#searchBox');
        if (theme === 'dark') {
            searchBox
                .style('background-color', '#3c3c3c')
                .style('color', '#ffffff')
                .style('border-color', '#555555');
        } else {
            searchBox
                .style('background-color', '#ffffff')
                .style('color', '#000000')
                .style('border-color', '#cccccc');
        }
    }

    function handleSearch() {
        const searchBox = d3.select('#searchBox');
        const matchCount = d3.select('#matchCount');
        
        searchBox.on('input', function() {
            searchQuery = this.value.toLowerCase();
            updateSearch();
        });

        function updateSearch() {
            // Reset all nodes to their original appearance
            nodes.selectAll('text')
                .style('fill', d => colorScale(d.depth))
                .style('font-weight', 'normal')
                .style('stroke', 'none')
                .style('stroke-width', 0)
                .style('text-shadow', 'none');

            if (searchQuery) {
                // Find matching nodes
                searchResults = nodes.filter(d => 
                    d.data.name.toLowerCase().includes(searchQuery)
                );

                // Set non-matching nodes to white
                nodes.selectAll('text')
                    .style('fill', '#ffffff');

                // Highlight matching text in yellow
                searchResults.selectAll('text')
                    .style('fill', '#ffff00')
                    .style('font-weight', 'bold')
                    .style('text-shadow', '0 0 3px black');

                // Update match count
                matchCount.text(`${searchResults.size()} matches found`);
            } else {
                searchResults = [];
                matchCount.text('');
            }
        }
    }

    function renderCodeMap() {
        d3.select('#codeMap').selectAll('*').remove();

        const margin = {top: 40, right: 20, bottom: 40, left: 20};
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

        // Count leaves to determine tree breadth
        let maxDepth = 0;
        root.eachBefore(d => {
            if (d.depth > maxDepth) maxDepth = d.depth;
        });

        // Calculate dimensions
        const nodeSize = 10;
        const horizontalSpacing = 200;
        const verticalSpacing = 150;

        const treeWidth = width;
        const treeHeight = (maxDepth + 1) * verticalSpacing;

        const treeLayout = d3.tree()
            .size([treeWidth, treeHeight])
            .nodeSize([horizontalSpacing, verticalSpacing]);

        treeLayout(root);

        // Adjust node positions
        root.eachBefore(d => {
            d.y = d.depth * verticalSpacing;
        });

        // Center the tree
        const rootX = root.x;
        root.eachBefore(d => {
            d.x -= rootX - width / 2;
        });

        // Links
        links = g.selectAll('.link')
            .data(root.links())
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', d => `M${d.source.x},${d.source.y + 20}L${d.source.x},${(d.source.y + d.target.y) / 2}H${d.target.x}V${d.target.y}`)
            .style('stroke', d => colorScale(d.source.depth))
            .style('stroke-width', 2)
            .style('fill', 'none');

        // Nodes
        nodes = g.selectAll('.node')
            .data(root.descendants())
            .enter().append('g')
            .attr('class', d => 'node' + (d.children ? ' node--internal' : ' node--leaf'))
            .attr('transform', d => `translate(${d.x},${d.y})`);

        nodes.append('rect')
            .attr('width', nodeSize)
            .attr('height', nodeSize)
            .attr('x', -nodeSize / 2)
            .attr('y', -nodeSize / 2)
            .style('fill', d => colorScale(d.depth))
            .style('stroke', '#ffffff')
            .style('stroke-width', 1);

        nodes.append('text')
            .attr('dy', '1.5em')
            .attr('text-anchor', 'middle')
            .text(d => d.data.name)
            .style('fill', d => colorScale(d.depth))
            .style('font-size', '12px')
            .each(function(d) {
                const self = d3.select(this);
                const textLength = self.node().getComputedTextLength();
                if (textLength > horizontalSpacing - 10) {
                    const text = self.text();
                    const ellipsisWidth = self.text('...').node().getComputedTextLength();
                    const availableWidth = horizontalSpacing - 10 - ellipsisWidth;
                    let truncatedText = '';
                    for (let i = 0; i < text.length; i++) {
                        if (self.text(text.slice(0, i)).node().getComputedTextLength() > availableWidth) {
                            truncatedText = text.slice(0, i - 1);
                            break;
                        }
                    }
                    self.text(truncatedText + '...');
                }
            });

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        nodes.on('mouseover', function(event, d) {
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

        // Create search box if it doesn't exist
        if (!d3.select('#searchBox').node()) {
            createSearchBox();
        }
        
        // Initialize search functionality
        handleSearch();

        // Initial fit to frame
        fitToFrame();
    }

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

