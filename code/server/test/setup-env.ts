/**
 * jest 全局 setup：在测试模块加载前注入环境变量，
 * 避免 crypto.util 因缺 FIELD_ENCRYPTION_KEY 走开发兜底并打印 console.warn。
 * 该值仅为测试环境专用，与生产密钥无关。
 */
process.env.FIELD_ENCRYPTION_KEY = 'oiD9OF2A8cnUaqUNAjpQzhIg6L6GDaK449cV4wZb1OU=';
