
import { PoemLocation } from './types';

export const INITIAL_LOCATIONS: PoemLocation[] = [
  {
    id: '1',
    name: 'جرة نابل الشهيرة',
    lat: 300,
    lng: 400,
    description: 'رمز المدينة وعاصمة الفخار، تتوسط نابل بجمالها وألوانها.',
    poet: 'أبو القاسم الشابي',
    preview: 'إذا الشعب يوماً أراد الحياة...',
    isPurchased: false,
    price: 15
  },
  {
    id: '2',
    name: 'موقع نيابوليس الأثري',
    lat: 450,
    lng: 500,
    description: 'المدينة القديمة الغارقة تحت البحر، شاهدة على العصر الروماني.',
    poet: 'جعفر ماجد',
    preview: 'على رملها يكتب البحر سطراً...',
    isPurchased: false,
    price: 20
  },
  {
    id: '3',
    name: 'سوق البلغة والصناعات',
    lat: 250,
    lng: 350,
    description: 'قلب نابل العتيق حيث تفوح رائحة الزهر والياسمين.',
    poet: 'الصغير أولاد أحمد',
    preview: 'نحب البلاد كما لا يحب البلاد أحد...',
    isPurchased: false,
    price: 25
  },
  {
    id: '4',
    name: 'شاطئ نابل الساحر',
    lat: 500,
    lng: 650,
    description: 'رمال ذهبية ومياه فيروزية تحاكي جمال الوطن القبلي.',
    poet: 'منصف المزغني',
    preview: 'يا بحر نابل يا مرآة أشواقي...',
    isPurchased: false,
    price: 30
  },
  {
    id: '5',
    name: 'مسجد نابل الكبير',
    lat: 200,
    lng: 420,
    description: 'منارة علم ودين تتميز بمعمارها الأندلسي العريق.',
    poet: 'أحمد اللغماني',
    preview: 'في صحن دارك يخشع الوجدان...',
    isPurchased: false,
    price: 10
  }
];
