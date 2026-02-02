
import { PoemLocation } from './types';

export const INITIAL_LOCATIONS: PoemLocation[] = [
  {
    id: 'nabeul-1',
    name: 'جرة نابل الشهيرة',
    lat: 350,
    lng: 400,
    description: 'رمز مدينة نابل وقلبها النابض بفن الفخار والوطن القبلي.',
    poet: 'أبو القاسم الشابي',
    preview: 'يا جرة الطين التي حفظت الندى...',
    isPurchased: false,
    price: 20
  },
  {
    id: 'nabeul-2',
    name: 'شاطئ سيدي المحرصي',
    lat: 250,
    lng: 550,
    description: 'أجمل شواطئ الوطن القبلي، حيث تلتقي زرقة البحر بعبق الياسمين.',
    poet: 'محمود درويش',
    preview: 'للبحر رائحة البلاد ونابل...',
    isPurchased: false,
    price: 30
  },
  {
    id: 'nabeul-3',
    name: 'سوق الجمعة',
    lat: 420,
    lng: 380,
    description: 'قلب نابل الشعبي، حيث يباع الفخار والحصير وعبق التاريخ في كل زاوية.',
    poet: 'نزار قباني',
    preview: 'في أزقة نابل عطرك يسكنني...',
    isPurchased: false,
    price: 15
  },
  {
    id: 'nabeul-4',
    name: 'متحف نابل الأثري',
    lat: 380,
    lng: 450,
    description: 'شاهد على تاريخ المدينة القديمة "نيابوليس" والفسيفساء النادرة.',
    poet: 'أنسي الحاج',
    preview: 'حجارة الصمت في متحف الذكريات...',
    isPurchased: false,
    price: 25
  },
  {
    id: 'nabeul-5',
    name: 'دار شعبان الفهري',
    lat: 280,
    lng: 300,
    description: 'معقل فن النحت على الحجارة والتراث العمراني الأصيل.',
    poet: 'أدونيس',
    preview: 'نحتنا من صخرنا وجوه العابرين...',
    isPurchased: false,
    price: 35
  }
];
