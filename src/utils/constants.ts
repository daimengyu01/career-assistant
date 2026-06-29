/**
 * 应用常量
 * 包含行业列表、城市列表、公司规模、教育程度等
 */

export const INDUSTRIES = [
  '互联网',
  '软件开发',
  '人工智能',
  '大数据',
  '云计算',
  '电子商务',
  '金融科技',
  '区块链',
  '物联网',
  '游戏',
  '教育科技',
  '医疗健康',
  '生物医药',
  '新能源',
  '半导体',
  '汽车',
  '制造业',
  '咨询服务',
  '广告营销',
  '媒体娱乐',
  '房地产',
  '物流',
  '零售',
  '餐饮',
  '旅游',
  '其他',
] as const;

export const CITIES = [
  '北京',
  '上海',
  '深圳',
  '广州',
  '杭州',
  '南京',
  '成都',
  '武汉',
  '西安',
  '苏州',
  '重庆',
  '天津',
  '长沙',
  '郑州',
  '青岛',
  '大连',
  '厦门',
  '合肥',
  '济南',
  '福州',
  '昆明',
  '贵阳',
  '南宁',
  '海口',
  '三亚',
  '拉萨',
  '乌鲁木齐',
  '兰州',
  '银川',
  '西宁',
  '石家庄',
  '太原',
  '呼和浩特',
  '沈阳',
  '长春',
  '哈尔滨',
  '南昌',
  '其他',
] as const;

export const COMPANY_SCALES = [
  { value: 'startup', label: '初创公司' },
  { value: 'medium', label: '中型企业' },
  { value: 'large', label: '大型企业' },
] as const;

export const EDUCATION_LEVELS = [
  '高中及以下',
  '大专',
  '本科',
  '硕士',
  '博士',
  'MBA',
  '其他',
] as const;

export const MAJORS = [
  '计算机科学',
  '软件工程',
  '电子信息工程',
  '通信工程',
  '自动化',
  '机械工程',
  '土木工程',
  '建筑学',
  '金融学',
  '经济学',
  '工商管理',
  '市场营销',
  '会计学',
  '人力资源管理',
  '法学',
  '医学',
  '护理学',
  '药学',
  '生物学',
  '化学',
  '物理学',
  '数学',
  '统计学',
  '心理学',
  '英语',
  '日语',
  '德语',
  '法语',
  '设计学',
  '新闻传播',
  '其他',
] as const;

export const RISK_PREFERENCES = [
  { value: 'conservative', label: '保守型', description: '偏好稳定，风险承受能力低' },
  { value: 'balanced', label: '平衡型', description: '在风险和收益之间寻求平衡' },
  { value: 'aggressive', label: '进取型', description: '偏好高风险高回报，勇于创新' },
] as const;

export const MBTI_TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
] as const;

export const FUNDING_STAGES = [
  '种子轮',
  '天使轮',
  'Pre-A轮',
  'A轮',
  'B轮',
  'C轮',
  'D轮',
  'E轮及以后',
  'IPO',
  '已退市',
  '未融资',
  '不需要融资',
] as const;

export const STABILITY_SCORE_LABELS: Record<number, string> = {
  0: '极不稳定',
  25: '不太稳定',
  50: '一般',
  75: '比较稳定',
  100: '非常稳定',
};

export const PROMOTION_CLARITY_LABELS: Record<number, string> = {
  0: '非常模糊',
  25: '不太清晰',
  50: '一般',
  75: '比较清晰',
  100: '非常清晰',
};

export const ASSESSMENT_TYPES = [
  { value: 'personality', label: '人格测评', description: 'MBTI 人格类型测试' },
  { value: 'interest', label: '兴趣测评', description: '职业兴趣倾向测试' },
  { value: 'career_match', label: '职业匹配', description: '职业适配度评估' },
] as const;

export const AI_PROVIDERS = [
  { value: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'] },
  { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview'] },
] as const;

export const DEBOUNCE_DEFAULT_DELAY = 300;
export const TOAST_DEFAULT_DURATION = 3000;
export const PAGE_DEFAULT_SIZE = 20;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const APP_NAME = 'CareerAssistant';
export const APP_VERSION = '0.1.0';

export const DATE_FORMATS = {
  date: 'yyyy-MM-dd',
  time: 'HH:mm:ss',
  datetime: 'yyyy-MM-dd HH:mm:ss',
  full: 'yyyy年MM月dd日 HH:mm',
} as const;

export const MBTI_DIMENSIONS = [
  { key: 'extroversion', label: '外向性', lowLabel: '内向 (I)', highLabel: '外向 (E)' },
  { key: 'openness', label: '开放性', lowLabel: '实感 (S)', highLabel: '直觉 (N)' },
  { key: 'conscientiousness', label: '尽责性', lowLabel: '感知 (P)', highLabel: '判断 (J)' },
  { key: 'agreeableness', label: '宜人性', lowLabel: '思考 (T)', highLabel: '情感 (F)' },
] as const;
