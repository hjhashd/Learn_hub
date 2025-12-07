const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const DATA_DIR = path.join(__dirname, '..', 'data');
const KNOWLEDGE_DIR = path.join(DATA_DIR, 'knowledge');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 读取所有知识条目
function getAllKnowledgeFromFiles() {
  const items = [];
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.md')) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const { data, content: markdownContent } = matter(content);
          
          items.push({
            id: data.id,
            title: data.title,
            content: markdownContent.trim(),
            category: data.category || '未分类',
            tags: data.tags || [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error reading file ${filePath}:`, error);
        }
      }
    });
  }
  
  scanDirectory(KNOWLEDGE_DIR);
  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// 生成知识条目文件名
function generateKnowledgeFilename(item) {
  const safeTitle = item.title
    .replace(/[\/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  const date = new Date(item.createdAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  return `${year}/${month}/${item.id}-${safeTitle}.md`;
}

// 重新构建索引
function rebuildIndex() {
  const knowledgeItems = getAllKnowledgeFromFiles();
  const categoryStats = {};
  const tagStats = {};

  knowledgeItems.forEach(item => {
    // 统计分类
    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    
    // 统计标签
    item.tags.forEach(tag => {
      tagStats[tag] = (tagStats[tag] || 0) + 1;
    });
  });

  // 预定义的分类配置
  const predefinedCategories = [
    { id: 'tech', name: 'tech', icon: 'Code', color: '#3B82F6' },
    { id: 'life', name: 'life', icon: 'Heart', color: '#EF4444' },
    { id: 'work', name: 'work', icon: 'Briefcase', color: '#10B981' },
    { id: 'study', name: 'study', icon: 'BookOpen', color: '#F59E0B' },
    { id: 'thinking', name: 'thinking', icon: 'Lightbulb', color: '#8B5CF6' }
  ];

  // 构建最终的分类数组
  const categories = predefinedCategories.map(cat => ({
    ...cat,
    count: categoryStats[cat.name] || 0
  }));

  const index = {
    knowledge: knowledgeItems.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      tags: item.tags,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      filePath: generateKnowledgeFilename(item)
    })),
    categories,
    tags: tagStats,
    lastUpdated: new Date().toISOString()
  };

  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  console.log('索引重建完成！');
  console.log(`知识条目数量: ${knowledgeItems.length}`);
  console.log(`分类数量: ${categories.length}`);
  console.log(`标签数量: ${Object.keys(tagStats).length}`);
}

// 执行重建
rebuildIndex();