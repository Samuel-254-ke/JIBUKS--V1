const fs = require('fs');

try {
    const raw = fs.readFileSync('figma_data_new.json', 'utf8');
    const data = JSON.parse(raw);

    let output = '';

    // Function to recursively find text
    function traverse(node, depth = 0) {
        const indent = '  '.repeat(depth);

        if (node.name) {
            output += `${indent}Name: ${node.name} (${node.type})\n`;
        }

        if (node.type === 'TEXT' && node.characters) {
            output += `${indent}  Text: "${node.characters}"\n`;
        }

        if (node.children) {
            node.children.forEach(child => traverse(child, depth + 1));
        }
    }

    const nodes = data.nodes;
    if (nodes) {
        Object.keys(nodes).forEach(key => {
            output += `Processing Node: ${key}\n`;
            traverse(nodes[key].document);
        });
    } else {
        output += 'No nodes found\n';
    }

    fs.writeFileSync('figma_structure_new.txt', output);
    console.log('Saved structure to figma_structure_new.txt');

} catch (e) {
    console.error(e);
}
