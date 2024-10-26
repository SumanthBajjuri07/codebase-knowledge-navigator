(function() {
    const vscode = acquireVsCodeApi();

    let codeMap;
    let svg, g, zoom;
    let nodes, links;
    let searchQuery = '';
    let searchResults = [];
    let currentSearchIndex = -1;
    let currentTheme = 'light';

    // Color scale for depth-based coloring
    const colorScale = d3.scaleOrdinal()
        .domain([0, 1, 2, 3, 4, 5])
        .range(['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308']);


    // Theme-specific colors
    const themeColors = {
        light: {
            background: '#ffffff',
            text: '#706c6c',
            border: '#cccccc',
            tooltipBg: 'rgba(255, 255, 255, 0.95)',
            tooltipText: '#333333',
            tooltipBorder: '#ddd',
            searchUnmatched: '#cccccc',
            searchMatch: '#ffff00',
            searchMatchShadow: 'black'
        },
        dark: {
            background: '#1e1e1e',
            text: '#ffffff',
            border: '#555555',
            tooltipBg: 'rgba(30, 30, 30, 0.95)',
            tooltipText: '#ffffff',
            tooltipBorder: '#555555',
            searchUnmatched: '#4a4a4a',
            searchMatch: '#ffd700',
            searchMatchShadow: 'black'
        }
    };


    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updateCodeMap':
                codeMap = message.codeMap;
                renderCodeMap();
                break;
            case 'themeChanged':
                currentTheme = message.theme;
                updateTheme(message.theme);
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
            .style('padding', '8px 12px')
            .style('border-radius', '6px')
            .style('border', '1px solid')
            .style('outline', 'none')
            .style('font-size', '14px')
            .style('width', '200px')
            .style('transition', 'all 0.3s ease');

        const matchCount = searchContainer
            .append('span')
            .attr('id', 'matchCount')
            .style('margin-left', '10px')
            .style('font-size', '13px')
            .style('font-weight', '500');

        updateTheme(currentTheme);
        return searchBox;
    }


    function updateTheme(theme) {
        currentTheme = theme;
        const colors = themeColors[theme];
        
        // Update search box
        const searchBox = d3.select('#searchBox');
        searchBox
            .style('background-color', colors.background)
            .style('color', colors.text)
            .style('border-color', colors.border);

        // Update match count
        const matchCount = d3.select('#matchCount')
            .style('color', colors.text);

        // Update tooltip style
        d3.select('.tooltip')
            .style('background-color', colors.tooltipBg)
            .style('color', colors.tooltipText)
            .style('border-color', colors.tooltipBorder);

        // Update search highlighting if search is active
        if (searchQuery) {
            updateSearch();
        }
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
    }

    function updateSearch() {
        const colors = themeColors[currentTheme];
        
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

            // Set non-matching nodes to theme-specific color
            nodes.selectAll('text')
                .style('fill', colors.searchUnmatched);

            // Highlight matching text
            searchResults.selectAll('text')
                .style('fill', colors.searchMatch)
                .style('font-weight', 'bold')
                .style('text-shadow', `0 0 3px ${colors.searchMatchShadow}`);

            // Update match count
            const matchCount = d3.select('#matchCount')
                .text(`${searchResults.size()} matches found`)
                .style('color', colors.text);
        } else {
            searchResults = [];
            d3.select('#matchCount').text('');
            
            // Reset to original colors
            nodes.selectAll('text')
                .style('fill', d => colorScale(d.depth));
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

        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0)
            .style('border-radius', '8px')
            .style('padding', '16px')
            .style('box-shadow', '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)')
            .style('max-width', '350px')
            .style('font-size', '13px')
            .style('line-height', '1.5')
            .style('transition', 'opacity 0.2s ease');

        updateTheme(currentTheme);

        nodes.on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 1);
                tooltip.html(getTooltipContent(d.data))
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mousemove', function(event) {
                tooltip.style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
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
        const colors = themeColors[currentTheme];
        let content = `<div style="color: ${colors.tooltipText};">`;
        
        // File name with larger, bold text
        content += `<div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; color: ${currentTheme === 'dark' ? '#60a5fa' : '#2563eb'};">
            ${data.name}
        </div>`

        // Type indicator with theme-aware background
        const typeBgColor = currentTheme === 'dark' ? 
            (data.type === 'file' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(234, 179, 8, 0.2)') :
            (data.type === 'file' ? '#dbeafe' : '#fef3c7');
        
        content += `<div style="display: inline-block; background: ${typeBgColor}; 
            padding: 4px 8px; border-radius: 4px; margin-bottom: 10px; font-size: 12px;">
            ${data.type}
        </div>`;

        if (data.type === 'file') {
            const sections = [
                { title: 'Functions', data: data.functions },
                { title: 'Classes', data: data.classes },
                { title: 'Imports', data: data.imports },
                { title: 'Exports', data: data.exports }
            ];

            sections.forEach(section => {
                if (section.data && section.data.length) {
                    content += `
                        <div style="margin-top: 10px;">
                            <div style="font-weight: 600; color: ${currentTheme === 'dark' ? '#e5e7eb' : '#4b5563'}; margin-bottom: 4px;">
                                ${section.title}:
                            </div>
                            <div style="margin-left: 8px; color: ${currentTheme === 'dark' ? '#9ca3af' : '#6b7280'}; line-height: 1.5;">
                                ${section.data.join(', ')}
                            </div>
                        </div>`;
                }
            });
        }

        content += `</div>`;
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