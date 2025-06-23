import { Category, Tag } from './types';

export interface PersonaTheme {
  id: string;
  name: string;
  description?: string;
}

export const DERIVED_PINGINFO_TAG_CATEGORY: Category = {
  id: 'derived-pinginfo',
  name: 'メタデータ由来 (AI処理済)',
  color: 'bg-emerald-600', // Example color
  textColor: 'text-emerald-100',
};

export const CATEGORIES: Category[] = [
  // --- 画風 (Style/Art) ---
  {
    id: 'styleArt', name: '画風', color: 'bg-sky-600', textColor: 'text-sky-100',
    subCategories: [
      {
        id: 'artStyle', name: 'スタイル', tags: [
          { id: 'sa1', name: 'photorealistic', japaneseName: '写真風リアル' },
          { id: 'sa2', name: 'anime style', japaneseName: 'アニメ風' },
          { id: 'sa3', name: 'manga style', japaneseName: '漫画風' },
          { id: 'sa4', name: 'illustration', japaneseName: 'イラスト風' },
          { id: 'sa5', name: 'oil painting', japaneseName: '油絵風' },
          { id: 'sa6', name: 'watercolor', japaneseName: '水彩画風' },
          { id: 'sa7', name: 'sketch', japaneseName: 'スケッチ風' },
          { id: 'sa8', name: 'pixel art', japaneseName: 'ドット絵風' },
          { id: 'sa9', name: '3d render', japaneseName: '3Dレンダー' },
          { id: 'sa10', name: 'game_cg', japaneseName: 'ゲームCG' },
          { id: 'sa11', name: 'comic_style', japaneseName: 'コミック風' },
          { id: 'sa12', name: '4koma', japaneseName: '4コマ漫画' },
          { id: 'sa13', name: 'cosplay_photo', japaneseName: 'コスプレ写真' },
          { id: 'sa14', name: 'realistic_style', japaneseName: 'リアルなスタイル' },
          { id: 'sa15', name: 'silhouette_style', japaneseName: 'シルエットスタイル' },
          { id: 'sa16', name: '8-bit_game_style', japaneseName: '8ビットゲーム風' },
          { id: 'sa17', name: '1980s_anime_style', japaneseName: '1980年代アニメ風' },
          { id: 'sa18', name: 'disney_movie_style', japaneseName: 'ディズニー映画風' },
          { id: 'sa19', name: 'studio_ghibli_style', japaneseName: 'スタジオジブリ風' },
          { id: 'sa20', name: 'synthwave_style', japaneseName: 'シンセウェーブ風' },
          { id: 'sa21', name: 'logo_style', japaneseName: 'ロゴ風' },
        ]
      },
      {
        id: 'artMedium', name: '画材・種類', tags: [
          { id: 'am1', name: 'traditional_media_style', japaneseName: '伝統的な画材' },
          { id: 'am2', name: 'watercolor_painting_style', japaneseName: '水彩画' },
          { id: 'am3', name: 'ukiyo-e', japaneseName: '浮世絵' },
          { id: 'am4', name: 'oil_painting', japaneseName: '油絵' },
          { id: 'am5', name: 'monochrome', japaneseName: 'モノクロ' },
          { id: 'am6', name: 'lineart_style', japaneseName: '線画' },
          { id: 'am7', name: 'sketch_style', japaneseName: 'スケッチ' },
          { id: 'am8', name: 'pixel_art', japaneseName: 'ピクセルアート' },
        ]
      },
      {
        id: 'artMovement', name: '芸術様式', tags: [
          { id: 'amv1', name: 'art_nouveau', japaneseName: 'アール・ヌーヴォー' },
          { id: 'amv2', name: 'classicism', japaneseName: '古典主義' },
          { id: 'amv3', name: 'futurism', japaneseName: '未来派' },
          { id: 'amv4', name: 'dadaism', japaneseName: 'ダダイズム' },
          { id: 'amv5', name: 'abstract_art', japaneseName: '抽象芸術' },
          { id: 'amv6', name: 'alphonse_mucha_style', japaneseName: 'アルフォンス・ミュシャ風' },
          { id: 'amv7', name: 'monet_style', japaneseName: 'モネ風' },
        ]
      },
      {
        id: 'aspectRatio', name: 'アスペクト比', tags: [
          { id: 'ar1', name: '16:9 aspect ratio', japaneseName: '16:9 (横長)' },
          { id: 'ar2', name: '9:16 aspect ratio', japaneseName: '9:16 (縦長)' },
          { id: 'ar3', name: '1:1 aspect ratio', japaneseName: '1:1 (正方形)' },
          { id: 'ar4', name: '4:3 aspect ratio', japaneseName: '4:3' },
          { id: 'ar5', name: '3:2 aspect ratio', japaneseName: '3:2' },
        ]
      }
    ]
  },
  // --- 特徴 (Features) ---
  {
    id: 'features', name: '特徴', color: 'bg-indigo-600', textColor: 'text-indigo-100',
    subCategories: [
      { id: 'race', name: '種族・人種', tags: [
        { id: 'r1', name: 'human', japaneseName: '人間' },
        { id: 'r1a', name: 'japanese person', japaneseName: '日本人' },
        { id: 'r1b', name: 'korean person', japaneseName: '韓国人' },
        { id: 'r1c', name: 'caucasian', japaneseName: '白人系' },
        { id: 'r1d', name: 'black person', japaneseName: '黒人系' },
        { id: 'r2', name: 'elf', japaneseName: 'エルフ' },
        { id: 'r3', name: 'half-elf', japaneseName: 'ハーフエルフ' },
        { id: 'r4', name: 'orc', japaneseName: 'オーク' },
        { id: 'r5', name: 'demon', japaneseName: '悪魔' },
        { id: 'r6', name: 'angel', japaneseName: '天使' },
        { id: 'r7', name: 'personification', japaneseName: '擬人化' },
      ]},
      { id: 'gender', name: '性別', tags: [
        { id: 'g1', name: '1girl', japaneseName: '女性1人' },
        { id: 'g1a', name: 'woman', japaneseName: '女性' },
        { id: 'g2', name: '1boy', japaneseName: '男性1人' },
        { id: 'g2a', name: 'man', japaneseName: '男性' },
      ]},
      { id: 'age', name: '年齢', tags: [
        { id: 'a1', name: 'toddler', japaneseName: '幼児' },
        { id: 'a1a', name: 'kindergartner', japaneseName: '幼稚園児' },
        { id: 'a1b', name: 'child', japaneseName: '子供' },
        { id: 'a2', name: 'teenager', japaneseName: '10代' },
        { id: 'a3', name: 'young adult', japaneseName: '若者 (20代)' },
        { id: 'a4', name: 'adult', japaneseName: '成人 (30代)' },
        { id: 'a5', name: 'middle-aged', japaneseName: '中年 (40代)' },
        { id: 'a6', name: 'mature_female', japaneseName: '成熟した女性' },
        { id: 'a7', name: 'elderly woman', japaneseName: '年配の女性' },
        { id: 'a8', name: 'elderly man', japaneseName: '年配の男性' },
      ]},
      { id: 'occupation', name: '職業・身分', tags: [
        { id: 'o1', name: 'student', japaneseName: '学生' },
        { id: 'o2', name: 'office_lady', japaneseName: 'OL' },
        { id: 'o3', name: 'teacher', japaneseName: '教師' },
        { id: 'o4', name: 'nurse', japaneseName: '看護師' },
        { id: 'o5', name: 'doctor', japaneseName: '医師' },
        { id: 'o6', name: 'police_officer', japaneseName: '警察官' },
        { id: 'o7', name: 'firefighter', japaneseName: '消防士' },
        { id: 'o8', name: 'chef', japaneseName: 'シェフ' },
        { id: 'o9', name: 'waitress', japaneseName: 'ウェイトレス' },
        { id: 'o10', name: 'maid', japaneseName: 'メイド' },
        { id: 'o11', name: 'idol', japaneseName: 'アイドル' },
        { id: 'o12', name: 'miko', japaneseName: '巫女' },
        { id: 'o13', name: 'nun', japaneseName: '修道女' },
        { id: 'o14', name: 'knight', japaneseName: '騎士' },
        { id: 'o15', name: 'samurai', japaneseName: '侍' },
        { id: 'o16', name: 'magician', japaneseName: '魔術師' },
        { id: 'o17', name: 'scientist', japaneseName: '科学者' },
        { id: 'o18', name: 'athlete', japaneseName: 'アスリート' },
        { id: 'o19', name: 'cheerleader', japaneseName: 'チアリーダー' },
        { id: 'o20', name: 'queen', japaneseName: '女王' },
        { id: 'o21', name: 'spy', japaneseName: 'スパイ' },
        { id: 'o22', name: 'assassin', japaneseName: '暗殺者' },
        { id: 'o23', name: 'detective', japaneseName: '探偵' },
        { id: 'o24', name: 'pilot', japaneseName: 'パイロット' },
        { id: 'o25', name: 'astronaut', japaneseName: '宇宙飛行士' },
      ]},
      { id: 'characterTrait', name: '性格・属性', tags: [
        { id: 'ct1', name: 'kawaii', japaneseName: '可愛い' },
        { id: 'ct2', name: 'bishoujo', japaneseName: '美少女' },
        { id: 'ct3', name: 'gyaru', japaneseName: 'ギャル' },
        { id: 'ct4', name: 'ojousama', japaneseName: 'お嬢様' },
        { id: 'ct5', name: 'tsundere_expression', japaneseName: 'ツンデレ' },
        { id: 'ct6', name: 'yandere_expression', japaneseName: 'ヤンデレ' },
      ]}
    ]
  },
  // --- 顔 (Face) ---
  {
    id: 'face', name: '顔', color: 'bg-purple-600', textColor: 'text-purple-100',
    subCategories: [
      { id: 'faceShape', name: '顔の輪郭', tags: [
        { id: 'fs1', name: 'oval_face', japaneseName: '卵型の顔' },
        { id: 'fs2', name: 'round_face', japaneseName: '丸顔' },
        { id: 'fs3', name: 'square_face', japaneseName: '四角い顔' },
        { id: 'fs4', name: 'sharp chin', japaneseName: '尖った顎' },
        { id: 'fs5', name: 'baby_face', japaneseName: 'ベビーフェイス' },
        { id: 'fs6', name: 'heart-shaped_face', japaneseName: 'ハート型の顔' },
      ]},
      { id: 'eyebrows', name: '眉毛', tags: [
        { id: 'fb1', name: 'arched eyebrows', japaneseName: 'アーチ眉' },
        { id: 'fb2', name: 'straight eyebrows', japaneseName: 'ストレート眉' },
        { id: 'fb3', name: 'worried eyebrows', japaneseName: '困り眉' },
        { id: 'fb4', name: 'thick eyebrows', japaneseName: '太い眉' },
        { id: 'fb5', name: 'furrowed_brow', japaneseName: 'しかめ眉' },
      ]},
      { id: 'eyelashes', name: 'まつ毛', tags: [
        { id: 'fl1', name: 'long eyelashes', japaneseName: '長いまつ毛' },
        { id: 'fl2', name: 'curled eyelashes', japaneseName: 'カールしたまつ毛' },
        { id: 'fl3', name: 'colored_eyelashes', japaneseName: '色付きまつ毛' },
      ]},
      {
        id: 'eyeShape', name: '目の形', tags: [
          { id: 'es1', name: 'tsurime', japaneseName: 'つり目' },
          { id: 'es2', name: 'tareme', japaneseName: 'たれ目' },
          { id: 'es3', name: 'sanpaku eyes', japaneseName: '三白眼' },
          { id: 'es4', name: 'closed eyes', japaneseName: '閉じ目' },
          { id: 'es5', name: 'wide-eyed', japaneseName: 'ぱっちり' },
          { id: 'es6', name: 'half-closed eyes', japaneseName: '半目' },
          { id: 'es7', name: 'upturned gaze', japaneseName: '上目遣い' },
        ]
      },
      {
        id: 'eyeColor', name: '目の色', tags: [
          { id: 'ec1', name: 'blue eyes', japaneseName: '青い目' },
          { id: 'ec2', name: 'red eyes', japaneseName: '赤い目' },
          { id: 'ec3', name: 'green eyes', japaneseName: '緑の目' },
          { id: 'ec4', name: 'brown eyes', japaneseName: '茶色い目' },
          { id: 'ec5', name: 'black eyes', japaneseName: '黒い目' },
          { id: 'ec6', name: 'grey eyes', japaneseName: '灰色の目' },
          { id: 'ec7', name: 'golden eyes', japaneseName: '金色の目' },
          { id: 'ec8', name: 'heterochromia', japaneseName: 'オッドアイ' },
        ]
      },
      {
        id: 'pupils', name: '瞳孔', tags: [
          { id: 'fp1', name: 'sparkling eyes', japaneseName: 'キラキラした瞳' },
          { id: 'fp2', name: 'star-shaped pupils', japaneseName: '星型瞳孔' },
          { id: 'fp3', name: 'heart-shaped pupils', japaneseName: 'ハート型瞳孔' },
          { id: 'fp4', name: 'slit pupils', japaneseName: '猫のような瞳孔' },
          { id: 'fp5', name: 'dilated_pupils', japaneseName: '散大した瞳孔' },
          { id: 'fp6', name: 'constricted_pupils', japaneseName: '収縮した瞳孔' },
        ]
      },
      { id: 'undereye', name: '目の下', tags: [
        { id: 'fu1', name: 'eyebags', japaneseName: '涙袋' },
        { id: 'fu2', name: 'dark circles', japaneseName: '目のクマ' },
      ]},
      { id: 'nose', name: '鼻', tags: [
        { id: 'fn1', name: 'small nose', japaneseName: '小さい鼻' },
        { id: 'fn2', name: 'aquiline nose', japaneseName: '鷲鼻' },
        { id: 'fn3', name: 'button nose', japaneseName: '団子鼻' },
        { id: 'fn4', name: 'pointy_nose', japaneseName: '尖った鼻' },
        { id: 'fn5', name: 'wide_nose', japaneseName: '広い鼻' },
      ]},
      {
        id: 'mouth', name: '口・唇', tags: [
          { id: 'fm1', name: 'small mouth', japaneseName: '小さい口' },
          { id: 'fm2', name: 'full lips', japaneseName: '厚い唇' },
          { id: 'fm3', name: 'thin lips', japaneseName: '薄い唇' },
          { id: 'fm4', name: 'open mouth', japaneseName: '開いた口' },
          { id: 'fm5', name: 'tongue out', japaneseName: '舌出し' },
          { id: 'fm6', name: 'closed mouth', japaneseName: '閉じた口' },
          { id: 'fm7', name: 'pout', japaneseName: '口を尖らせる' },
          { id: 'fm8', name: 'lip_bite', japaneseName: '唇を噛む' },
        ]
      },
      { id: 'otherFaceFeatures', name: 'その他の顔特徴', tags: [
        { id: 'off1', name: 'mole', japaneseName: 'ほくろ' },
        { id: 'off2', name: 'freckles', japaneseName: 'そばかす' },
        { id: 'off3', name: 'acne', japaneseName: 'ニキビ' },
        { id: 'off4', name: 'dimples', japaneseName: 'えくぼ' },
        { id: 'off5', name: 'facial_piercing', japaneseName: '顔のピアス' },
        { id: 'off6', name: 'scar', japaneseName: '傷跡' },
      ]},
    ]
  },
  {
    id: 'hair', name: '髪', color: 'bg-green-600', textColor: 'text-green-100',
    subCategories: [
      { id: 'hairLength', name: '髪の長さ', tags: [
        { id: 'hl1', name: 'bald', japaneseName: '坊主・禿頭' },
        { id: 'hl2', name: 'very short hair', japaneseName: 'ベリーショートヘア' },
        { id: 'hl3', name: 'short hair', japaneseName: 'ショートヘア' },
        { id: 'hl3a', name: 'pixie cut', japaneseName: 'ピクシーカット' },
        { id: 'hl4', name: 'medium short hair', japaneseName: 'ミディアムショート' },
        { id: 'hl5', name: 'shoulder-length hair', japaneseName: 'ミディアムヘア(肩)' },
        { id: 'hl6', name: 'bob cut', japaneseName: 'ボブカット' },
        { id: 'hl7', name: 'medium long hair', japaneseName: 'セミロングヘア' },
        { id: 'hl8', name: 'long hair', japaneseName: 'ロングヘア' },
        { id: 'hl9', name: 'very long hair', japaneseName: 'スーパーロングヘア' },
        { id: 'hl10', name: 'short bangs', japaneseName: '短い前髪' },
        { id: 'hl11', name: 'hair over eyes', japaneseName: '目が隠れる前髪' },
      ]},
      { id: 'hairStyle', name: '髪型スタイル', tags: [
        { id: 'hs1', name: 'braid', japaneseName: '三つ編み' },
        { id: 'hs1a', name: 'french braid', japaneseName: '編み込み' },
        { id: 'hs2', name: 'single braid', japaneseName: '一本三つ編み' },
        { id: 'hs3', name: 'twin braids', japaneseName: '二本三つ編み' },
        { id: 'hs4', name: 'side braid', japaneseName: 'サイド三つ編み' },
        { id: 'hs5', name: 'bowl cut', japaneseName: 'ボウルカット(おかっぱ)' },
        { id: 'hs6', name: 'slicked back hair', japaneseName: 'オールバック' },
        { id: 'hs7', name: 'twintails', japaneseName: 'ツインテール' },
        { id: 'hs8', name: 'ponytail', japaneseName: 'ポニーテール' },
        { id: 'hs9', name: 'dreadlocks', japaneseName: 'ドレッドヘア' },
        { id: 'hs10', name: 'wavy hair', japaneseName: 'ウェーブヘア' },
        { id: 'hs11', name: 'curly hair', japaneseName: 'カーリーヘア' },
        { id: 'hs12', name: 'straight hair', japaneseName: 'ストレートヘア' },
      ]},
      { id: 'hairColor', name: '髪色', tags: [
        { id: 'hc1', name: 'black hair', japaneseName: '黒髪' },
        { id: 'hc2', name: 'brown hair', japaneseName: '茶髪' },
        { id: 'hc3', name: 'blonde hair', japaneseName: '金髪' },
        { id: 'hc4', name: 'red hair', japaneseName: '赤髪' },
        { id: 'hc5', name: 'blue hair', japaneseName: '青髪' },
        { id: 'hc6', name: 'pink hair', japaneseName: 'ピンク髪' },
        { id: 'hc7', name: 'silver hair', japaneseName: '銀髪' },
        { id: 'hc8', name: 'white hair', japaneseName: '白髪' },
      ]},
    ]
  },
  {
    id: 'body', name: '体', color: 'bg-pink-600', textColor: 'text-pink-100',
    subCategories: [
      { id: 'bodyType', name: '体型', tags: [
        { id: 'bt1', name: 'tall build', japaneseName: '高身長' },
        { id: 'bt2', name: 'short stature', japaneseName: '低身長' },
        { id: 'bt3', name: 'slim', japaneseName: 'スリム' },
        { id: 'bt4', name: 'slender', japaneseName: '細身' },
        { id: 'bt5', name: 'lanky', japaneseName: 'ひょろっとした' },
        { id: 'bt6', name: 'leggy', japaneseName: '脚長' },
        { id: 'bt7', name: 'average build', japaneseName: '標準体型' },
        { id: 'bt8', name: 'chubby', japaneseName: 'ぽっちゃり' },
        { id: 'bt9', name: 'curvy', japaneseName: '曲線的' },
        { id: 'bt10', name: 'athletic build', japaneseName: '筋肉質・アスリート体型' },
      ]},
      { id: 'breasts', name: '胸のサイズ', tags: [
        { id: 'br1', name: 'flat chest', japaneseName: '貧乳' },
        { id: 'br2', name: 'small breasts', japaneseName: '小さい胸' },
        { id: 'br3', name: 'medium breasts', japaneseName: '普通の胸' },
        { id: 'br4', name: 'large breasts', japaneseName: '大きい胸' },
        { id: 'br5', name: 'huge breasts', japaneseName: '巨乳' },
        { id: 'br6', name: 'gigantic breasts', japaneseName: '爆乳' },
      ]},
    ]
  },
  {
    id: 'decoration', name: '装飾', color: 'bg-yellow-500', textColor: 'text-yellow-900',
    tags: [
        { id: 'd1', name: 'glasses', japaneseName: 'メガネ' },
        { id: 'd2', name: 'sunglasses', japaneseName: 'サングラス' },
        { id: 'd3', name: 'hat', japaneseName: '帽子' },
        { id: 'd4', name: 'cap', japaneseName: 'キャップ' },
        { id: 'd5', name: 'hood', japaneseName: 'フード' },
        { id: 'd6', name: 'earrings', japaneseName: 'イヤリング／ピアス' },
        { id: 'd7', name: 'necklace', japaneseName: 'ネックレス' },
        { id: 'd8', name: 'ring', japaneseName: '指輪' },
        { id: 'd9', name: 'tattoo', japaneseName: 'タトゥー' },
        { id: 'd10', name: 'cat ears', japaneseName: '猫耳' },
        { id: 'd11', name: 'animal ears', japaneseName: '動物の耳' },
        { id: 'd12', name: 'wings', japaneseName: '翼' },
        { id: 'd13', name: 'horns', japaneseName: '角' },
    ]
  },
  {
    id: 'clothing', name: '服装', color: 'bg-amber-600', textColor: 'text-amber-100',
    tags: [
      { id: 'cl1', name: 'swimsuit', japaneseName: '水着' },
      { id: 'cl2', name: 'school uniform', japaneseName: '学生服' },
      { id: 'cl3', name: 'dress', japaneseName: 'ドレス' },
      { id: 'cl4', name: 'kimono', japaneseName: '着物・和服' },
      { id: 'cl5', name: 'pajamas', japaneseName: 'パジャマ' },
      { id: 'cl6', name: 'suit', japaneseName: 'スーツ' },
      { id: 'cl7', name: 't-shirt', japaneseName: 'Tシャツ' },
      { id: 'cl8', name: 'jeans', japaneseName: 'ジーンズ' },
      { id: 'cl9', name: 'maid outfit', japaneseName: 'メイド服' },
      { id: 'cl10', name: 'armor', japaneseName: '鎧・アーマー' },
      { id: 'cl11', name: 'hoodie', japaneseName: 'パーカー' },
      { id: 'cl12', name: 'bikini', japaneseName: 'ビキニ' },
    ]
  },
  {
    id: 'action', name: '動作', color: 'bg-lime-600', textColor: 'text-lime-100',
    tags: [
      { id: 'ac1', name: 'standing', japaneseName: '立ちポーズ' },
      { id: 'ac2', name: 'sitting', japaneseName: '座りポーズ' },
      { id: 'ac3', name: 'lying down', japaneseName: '寝そべりポーズ' },
      { id: 'ac4', name: 'running', japaneseName: '走る' },
      { id: 'ac5', name: 'jumping', japaneseName: 'ジャンプ' },
      { id: 'ac6', name: 'waving hand', japaneseName: '手を振る' },
      { id: 'ac7', name: 'arms crossed', japaneseName: '腕組み' },
      { id: 'ac8', name: 'holding weapon', japaneseName: '武器を持つ' },
      { id: 'ac9', name: 'looking at viewer', japaneseName: 'カメラ目線' },
      { id: 'ac10', name: 'dancing', japaneseName: 'ダンス' },
    ]
  },
  {
    id: 'expression', name: '表情', color: 'bg-rose-600', textColor: 'text-rose-100',
    tags: [
      { id: 'ex1', name: 'smile', japaneseName: '笑顔' },
      { id: 'ex1a', name: 'gentle smile', japaneseName: '微笑み' },
      { id: 'ex2', name: 'laughing', japaneseName: '笑っている' },
      { id: 'ex3', name: 'sad face', japaneseName: '悲しい顔' },
      { id: 'ex4', name: 'crying', japaneseName: '泣いている' },
      { id: 'ex4a', name: 'tears in eyes', japaneseName: '目に涙を浮かべる' },
      { id: 'ex5', name: 'angry face', japaneseName: '怒った顔' },
      { id: 'ex6', name: 'frowning', japaneseName: '眉をひそめる' },
      { id: 'ex7', name: 'surprised face', japaneseName: '驚いた顔' },
      { id: 'ex8', name: 'shocked', japaneseName: 'ショックを受けた顔' },
      { id: 'ex9', name: 'blushing', japaneseName: '赤面' },
      { id: 'ex10', name: 'shy', japaneseName: '恥ずかしがり' },
      { id: 'ex11', name: 'serious expression', japaneseName: '真剣な表情' },
      { id: 'ex12', name: 'smirk', japaneseName: 'にやり笑い' },
      { id: 'ex13', name: 'neutral expression', japaneseName: '無表情' },
      { id: 'ex14', name: 'thoughtful expression', japaneseName: '考え込む表情' },
      { id: 'ex15', name: 'winking', japaneseName: 'ウィンク' },
      { id: 'ex16', name: 'pout', japaneseName: '口をとがらせる' },
      { id: 'ex17', name: 'seductive look', japaneseName: '誘惑的な表情' },
      { id: 'ex18', name: 'painful expression', japaneseName: '苦痛の表情' },
      { id: 'ex19', name: 'happy face', japaneseName: '幸せな顔' },
    ]
  },
    // --- 背景 (Background) ---
    {
      id: 'background', name: '背景', color: 'bg-orange-600', textColor: 'text-orange-100',
      subCategories: [
        { id: 'location', name: '場所', tags: [
          { id: 'l1', name: 'outdoor', japaneseName: '屋外' },
          { id: 'l2', name: 'indoor', japaneseName: '屋内' },
          { id: 'l3', name: 'cityscape', japaneseName: '街並み' },
          { id: 'l4', name: 'forest', japaneseName: '森' },
          { id: 'l5', name: 'beach', japaneseName: 'ビーチ' },
          { id: 'l6', name: 'outer space', japaneseName: '宇宙' },
          { id: 'l7', name: 'sky', japaneseName: '空' },
          { id: 'l8', name: 'room', japaneseName: '部屋' },
          { id: 'l9', name: 'bedroom', japaneseName: '寝室' },
          { id: 'l10', name: 'classroom', japaneseName: '教室' },
          { id: 'l11', name: 'cafe', japaneseName: 'カフェ' },
          { id: 'l12', name: 'library', japaneseName: '図書館' },
          { id: 'l13', name: 'mountain', japaneseName: '山' },
          { id: 'l14', name: 'ocean', japaneseName: '海' },
          { id: 'l15', name: 'ruins', japaneseName: '遺跡' },
          { id: 'l16', name: 'church', japaneseName: '教会' },
          { id: 'l17', name: 'castle', japaneseName: '城' },
          { id: 'l18', name: 'sci-fi city', japaneseName: 'SF都市' },
          { id: 'l19', name: 'fantasy landscape', japaneseName: 'ファンタジー風景' },
          { id: 'l20', name: 'underwater', japaneseName: '水中' },
        ]},
        { id: 'weatherTime', name: '天気・時間', tags: [
          { id: 'wt1', name: 'day', japaneseName: '昼' },
          { id: 'wt2', name: 'night', japaneseName: '夜' },
          { id: 'wt3', name: 'sunset', japaneseName: '夕日' },
          { id: 'wt4', name: 'rain', japaneseName: '雨' },
          { id: 'wt5', name: 'snow', japaneseName: '雪' },
          { id: 'wt6', name: 'cloudy', japaneseName: '曇り' },
          { id: 'wt7', name: 'full_moon', japaneseName: '満月' },
          { id: 'wt8', name: 'starry_sky', japaneseName: '星空' },
        ]},
        { id: 'bgFeatures', name: '背景の特徴', tags: [
          { id: 'bf1', name: 'simple_background', japaneseName: 'シンプルな背景' },
          { id: 'bf2', name: 'white_background', japaneseName: '白背景' },
          { id: 'bf3', name: 'black_background', japaneseName: '黒背景' },
          { id: 'bf4', name: 'transparent_background', japaneseName: '透過背景' },
          { id: 'bf5', name: 'blurry_background', japaneseName: 'ぼかし背景' },
          { id: 'bf6', name: 'gradient_background', japaneseName: 'グラデーション背景' },
          { id: 'bf7', name: 'abstract_background', japaneseName: '抽象的背景' },
          { id: 'bf8', name: 'fireworks', japaneseName: '花火' },
        ]}
      ]
    },
  {
    id: 'lighting', name: 'ライティング', color: 'bg-cyan-600', textColor: 'text-cyan-100',
    tags: [
      { id: 'l1', name: 'studio lighting', japaneseName: 'スタジオ照明' },
      { id: 'l2', name: 'cinematic lighting', japaneseName: '映画風照明' },
      { id: 'l3', name: 'dramatic lighting', japaneseName: 'ドラマチック照明' },
      { id: 'l4', name: 'soft lighting', japaneseName: 'ソフトライト' },
      { id: 'l5', name: 'rim lighting', japaneseName: 'リムライト' },
      { id: 'l6', name: 'backlighting', japaneseName: '逆光' },
      { id: 'l7', name: 'volumetric lighting', japaneseName: 'ボリュームライト' },
      { id: 'l8', name: 'neon lights', japaneseName: 'ネオンライト' },
      { id: 'l9', name: 'natural light', japaneseName: '自然光' },
      { id: 'l10', name: 'sunlight', japaneseName: '太陽光・日差し' },
    ]
  },
  {
    id: 'angle', name: 'アングル', color: 'bg-blue-600', textColor: 'text-blue-100',
    tags: [
      { id: 'an1', name: 'from above', japaneseName: '俯瞰(上から)' },
      { id: 'an2', name: 'from below', japaneseName: '煽り(下から)' },
      { id: 'an3', name: 'from side', japaneseName: '横から' },
      { id: 'an4', name: 'from front', japaneseName: '正面から' },
      { id: 'an5', name: 'from behind', japaneseName: '後ろから' },
      { id: 'an6', name: 'close-up shot', japaneseName: 'クローズアップ' },
      { id: 'an7', name: 'full body shot', japaneseName: '全身ショット' },
      { id: 'an8', name: 'cowboy shot', japaneseName: 'カウボーイショット' },
      { id: 'an9', name: 'portrait shot', japaneseName: 'ポートレートショット' },
      { id: 'an10', name: 'wide shot', japaneseName: 'ワイドショット' },
    ]
  },
  {
    id: 'camera', name: 'カメラ', color: 'bg-violet-600', textColor: 'text-violet-100',
    tags: [
      { id: 'ca1', name: 'DSLR quality', japaneseName: 'デジタル一眼レフ品質' },
      { id: 'ca2', name: 'film grain', japaneseName: 'フィルムグレイン効果' },
      { id: 'ca3', name: 'depth of field', japaneseName: '被写界深度(ボケ味)' },
      { id: 'ca4', name: 'lens flare', japaneseName: 'レンズフレア効果' },
      { id: 'ca5', name: 'fisheye lens effect', japaneseName: '魚眼レンズ効果' },
      { id: 'ca6', name: 'macro photo', japaneseName: 'マクロ撮影風' },
      { id: 'ca7', name: 'blurry background', japaneseName: '背景ぼかし' },
      { id: 'ca8', name: 'soft focus', japaneseName: 'ソフトフォーカス' },
    ]
  },
  {
    id: 'free', name: 'フリー', color: 'bg-fuchsia-600', textColor: 'text-fuchsia-100',
    allowMultipleSelections: true, // Allow multiple selections for tags in this category
    subCategories: [
      { id: 'freeColor', name: '色', tags: [
        { id: 'fc1', name: 'red-', japaneseName: '赤-' },
        { id: 'fc2', name: 'blue-', japaneseName: '青-' },
        { id: 'fc3', name: 'green-', japaneseName: '緑-' },
        { id: 'fc4', name: 'yellow-', japaneseName: '黄-' },
        { id: 'fc5', name: 'purple-', japaneseName: '紫-' },
        { id: 'fc6', name: 'pink-', japaneseName: 'ピンク-' },
        { id: 'fc7', name: 'orange-', japaneseName: 'オレンジ-' },
        { id: 'fc8', name: 'brown-', japaneseName: '茶-' },
        { id: 'fc9', name: 'black-', japaneseName: '黒-' },
        { id: 'fc10', name: 'white-', japaneseName: '白-' },
        { id: 'fc11', name: 'gray-', japaneseName: '灰-' },
        { id: 'fc12', name: 'silver-', japaneseName: '銀-' },
        { id: 'fc13', name: 'gold-', japaneseName: '金-' },
      ]},
      { id: 'freeOther', name: '修飾語', tags: [
        { id: 'fo1', name: 'large-', japaneseName: '大きい-' },
        { id: 'fo2', name: 'medium size-', japaneseName: '中くらい-' },
        { id: 'fo3', name: 'small-', japaneseName: '小さい-' },
        { id: 'fo4', name: 'dark-', japaneseName: '暗い／濃い-' },
        { id: 'fo5', name: 'light-', japaneseName: '明るい／薄い-' },
        { id: 'fo6', name: 'long-', japaneseName: '長い-' },
        { id: 'fo7', name: 'short-', japaneseName: '短い-' },
        { id: 'fo8', name: 'beautiful-', japaneseName: '美しい-' },
        { id: 'fo9', name: 'cute-', japaneseName: '可愛い-' },
        { id: 'fo10', name: 'cool-', japaneseName: 'かっこいい-' },
        { id: 'fo11', name: 'fantasy-', japaneseName: 'ファンタジー風-' },
        { id: 'fo12', name: 'sci-fi-', japaneseName: 'SF風-' },
      ]}
    ]
  },
  {
    id: 'input', name: 'テキスト入力', color: 'bg-gray-500', textColor: 'text-gray-100', isInputCategory: true,
  },
  // --- 🔞その他/高度 (NSFW/Advanced) ---
  {
    id: 'advancedNsfw', name: '🔞その他', color: 'bg-red-700', textColor: 'text-red-100',
    isNsfwCategory: true,
    subCategories: [
      { id: 'character', name: 'キャラクター属性', tags: [
        { id: 'anc1', name: 'loli', japaneseName: 'ロリ' },
        { id: 'anc2', name: 'shota', japaneseName: 'ショタ' },
        { id: 'anc3', name: 'mesugaki', japaneseName: 'メスガキ' },
        { id: 'anc4', name: 'female_perv', japaneseName: '痴女' },
        { id: 'anc5', name: 'milf_char', japaneseName: '熟女キャラ' }, 
        { id: 'anc6', name: 'otoko_no_ko', japaneseName: '男の娘' },
        { id: 'anc7', name: 'crossdressing', japaneseName: '女装' },
        { id: 'anc8', name: 'futanari_char', japaneseName: 'ふたなりキャラ' }, 
      ]},
      { id: 'expressionAction', name: '表情・行為', tags: [
        { id: 'anea1', name: 'ahegao', japaneseName: 'アヘ顔' },
        { id: 'anea2', name: 'rape_face', japaneseName: 'レイプ顔' },
        { id: 'anea3', name: 'moaning', japaneseName: '呻き声' },
        { id: 'anea4', name: 'licking_action', japaneseName: '舐める(行為)' }, 
        { id: 'anea5', name: 'oral_action', japaneseName: 'オーラル(行為)' }, 
        { id: 'anea6', name: 'pole_dancing', japaneseName: 'ポールダンス' },
        { id: 'anea7', name: 'strangling_action', japaneseName: '絞める(行為)' }, 
      ]},
      { id: 'position', name: '体位・ポーズ', tags: [
        { id: 'anp1', name: 'bent_over', japaneseName: 'ベントオーバー' },
        { id: 'anp2', name: 'all_fours', japaneseName: '四つん這い' },
        { id: 'anp3', name: 'spread_legs_nsfw', japaneseName: '開脚(NSFW)' }, 
        { id: 'anp4', name: 'm_legs', japaneseName: 'M字開脚' },
        { id: 'anp5', name: 'straddling', japaneseName: '跨る' },
        { id: 'anp6', name: 'gravure_pose', japaneseName: 'グラビアポーズ' },
        { id: 'anp7', name: 'presenting', japaneseName: '見せつける' },
        { id: 'anp8', name: 'against_glass', japaneseName: 'ガラスに押し付け' },
      ]},
      { id: 'clothingNsfw', name: '服装・露出', tags: [ 
        { id: 'ancL1', name: 'fundoshi', japaneseName: 'ふんどし' },
        { id: 'ancL2', name: 'babydoll', japaneseName: 'ベビードール' },
        { id: 'ancL3', name: 'school_swimsuit_nsfw', japaneseName: 'スクール水着(NSFW)' }, 
        { id: 'ancL4', name: 'highleg_swimsuit', japaneseName: 'ハイレグ水着' },
        { id: 'ancL5', name: 'bikini_nsfw', japaneseName: 'ビキニ(NSFW)' }, 
        { id: 'ancL6', name: 'thong_bikini', japaneseName: 'Tバックビキニ' },
        { id: 'ancL7', name: 'bikini_top_only', japaneseName: 'ビキニトップのみ' },
        { id: 'ancL8', name: 'wedgie', japaneseName: '食い込み' },
        { id: 'ancL9', name: 'underbust_clothing', japaneseName: 'アンダーバスト(服装)' }, 
        { id: 'ancL10', name: 'strap_slip', japaneseName: 'ストラップずり落ち' },
        { id: 'ancL11', name: 'virgin_killer_sweater', japaneseName: '童貞を殺すセーター' },
        { id: 'ancL12', name: 'see-through_dress_nsfw', japaneseName: '透けるドレス(NSFW)' }, 
        { id: 'ancL13', name: 'microskirt', japaneseName: 'マイクロスカート' },
        { id: 'ancL14', name: 'crotchless_pants', japaneseName: 'クロッチレスパンツ' },
        { id: 'ancL15', name: 'buruma', japaneseName: 'ブルマ' },
        { id: 'ancL16', name: 'bodystocking', japaneseName: 'ボディストッキング' },
        { id: 'ancL17', name: 'pantyhose_nsfw', japaneseName: 'パンスト(NSFW)' }, 
        { id: 'ancL18', name: 'latex_clothing', japaneseName: 'ラテックス(服装)' }, 
        { id: 'ancL19', name: 'pasties_clothing', japaneseName: 'ニプレス(服装)' }, 
        { id: 'ancL20', name: 'dakimakura', japaneseName: '抱き枕' },
      ]},
      { id: 'slangEuphemismsNsfw', name: '隠語・表現(NSFW)', tags: [ 
        { id: 'se1', name: 'nakadashi_action', japaneseName: '中出し(行為)' }, 
        { id: 'se2', name: 'bukkake_action', japaneseName: 'ぶっかけ(行為)' }, 
        { id: 'se3', name: 'paizuri_action', japaneseName: 'パイズリ(行為)' }, 
        { id: 'se4', name: 'cum_on_body_action', japaneseName: 'ザーメン塗れ(行為)' }, 
        { id: 'se5', name: 'tentacles_nsfw', japaneseName: '触手(NSFW)' }, 
        { id: 'se6', name: 'harem_nsfw', japaneseName: 'ハーレム(NSFW)' }, 
        { id: 'se7', name: 'yaoi_nsfw', japaneseName: 'やおい(NSFW)' }, 
        { id: 'se8', name: 'yuri_nsfw', japaneseName: '百合(NSFW)' }, 
      ]},
      { id: 'otherAdvancedNsfw', name: 'その他高度な設定(NSFW)', tags: [ 
        { id: 'oa1_nsfw', name: 'bondage_nsfw', japaneseName: 'ボンデージ(NSFW)' }, 
        { id: 'oa2_nsfw', name: 'shibari_nsfw', japaneseName: '緊縛(NSFW)' }, 
        { id: 'oa3_nsfw', name: 'gagged_nsfw', japaneseName: '猿ぐつわ(NSFW)' }, 
        { id: 'oa4_nsfw', name: 'blindfolded_nsfw', japaneseName: '目隠し(NSFW)' }, 
        { id: 'oa5_nsfw', name: 'BDSM_nsfw', japaneseName: 'BDSM(NSFW)' }, 
        { id: 'oa6_nsfw', name: 'foot_licking_action', japaneseName: '足舐め(行為)' }, 
        { id: 'oa7_nsfw', name: 'guro_nsfw', japaneseName: 'グロ(NSFW)' }, 
        { id: 'oa8_nsfw', name: 'public_indecency_nsfw', japaneseName: '公然わいせつ(NSFW)' }, 
      ]}
    ]
  },
  DERIVED_PINGINFO_TAG_CATEGORY, // Add the new category here
];

export const PERSONA_THEMES: PersonaTheme[] = [
  { id: 'random_persona', name: 'ペルソナ生成', description: '完全にランダムなキャラクターのペルソナをAIが生成します。' },
  { id: 'high_school_girl', name: '女子高生', description: '日本の女子高生のペルソナを生成します。' },
  { id: 'office_lady', name: 'OL', description: 'オフィスで働く女性のペルソナを生成します。' },
  { id: 'gyaru', name: 'ギャル', description: '日本の「ギャル」ファッションスタイルの女性ペルソナを生成します。' },
  { id: 'mesugaki', name: 'メスガキ', description: '生意気で挑発的な若い女性キャラクター「メスガキ」のペルソナを生成します。' },
  { id: 'cabaret_girl', name: 'キャバ嬢', description: '日本のキャバクラで働く女性「キャバ嬢」のペルソナを生成します。' },
  { id: 'anime_character', name: 'アニメキャラ', description: 'アニメ風のキャラクターペルソナを生成します。' },
  { id: 'chibi_character', name: 'ちびキャラ', description: 'デフォルメされた「ちびキャラ」のペルソナを生成します。' },
];


export const MAX_TOKENS = 75;

export const STABLE_DIFFUSION_QUALITY_PREFIX = "masterpiece, best quality, ultra-detailed, high resolution, ";
export const MIDJOURNEY_PARAMS = " --ar 16:9 --v 6.0"; 

export const GEMINI_TEXT_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const IMAGEN_MODEL_NAME = "imagen-3.0-generate-002";

export const MAX_HISTORY_ITEMS = 20;
export const LOCAL_STORAGE_HISTORY_KEY = 'promptBuilderHistory_v1';

export const QUALITY_JUNK_TAGS: string[] = [
  'masterpiece', 'best quality', 'ultra-detailed', 'high resolution', 
  'photorealistic', 'hyperrealistic', 'realistic', '8k', '4k', 'ultra high res', 'absurdres',
  'highres', 'high quality', 'ultra quality',
  'score_9_up', 'score_8_up', 'score_7_up', 'score_6_up', 'score_5_up', 'score_4_up',
  'score_9', 'score_8', 'score_7', // Add simple scores as well
  'nsfw', 'sfw', 'explicit', 'suggestive', 'questionable', 'sensitive',
  'low quality', 'worst quality', 'jpeg artifacts', 'blurry', 'noise', 'watermark', 'signature', 'text', 'error',
  'parameters', 'negative prompt', 'steps', 'sampler', 'cfg scale', 'seed', 'size', 'model hash', 'model', 
  'clip skip', 'denoising strength', 'version', 'usercomment', 'imagedescription'
];

export const BANNED_WORDS: string[] = [
  // General explicit terms
  "nude", "naked", "undressed", "topless",
  "sex", "erotic", "porn", "explicit", "nsfw", "sexy", "milf",
  "genital", "genitalia", "pubic", "pubes", "vaginal",
  "cleavage", 
  
  // Specific body parts often used in explicit contexts
  // "breasts", // Removed as it's too general if "small breasts" is okay
  "nipples", "areola",
  "vagina", "pussy", "cunt",
  "penis", "cock", "dick", "erection", "multiple penises",
  "testicles", "scrotum",
  "anus", "anal", "ass", "buttocks", 
  "underboob", "sideboob",
  "pantie", "panties", "thong", "micro thong", "cameltoe", "garter belt",
  
  // Bodily fluids / excretions (often sexualized)
  "cum", "semen", "ejaculation", "female ejaculation", "squirt",
  "urine", "piss", "feces", "scat",
  "sweat", 
  "juice", 

  // Actions / Scenarios (explicitly sexual or violent)
  "fellatio", "oral", "blowjob",
  "cunnilingus",
  "irrumatio",
  "handjob",
  "footjob",
  "rape", "molest", "noncon", "non-consensual", "forced",
  "torture", "guro", "gore", "violence", "blood", "beheading", "decapitation", "kill", "murder",
  "bestiality", "zoo", 
  "incest",
  "group sex", "gangbang", "orgy", "threesome", "foursome",
  "double penetration", "spitroast",
  "cowgirl position", "doggy style", 
  "masturbation", "fingering",
  
  // Age-related / Illegal / Harmful
  "lolicon", "loli", "shota", "shotacon", 
  "child abuse", "underage", "minor", "teen", "boy", "girl", 
  "2boys", 
  "hetero", 
  "group", 

  // Implied/Suggestive terms (can be context-dependent, but often filtered)
  "implied anal", "implied nudity",
  "sexy panties",
  "saggy", 
  "hanging", // Added as a compromise for "hanging breasts" after "breasts" was removed

  // Potentially hate speech or harmful symbols - requires careful curation
  // "swastika", "nazi", 
  // (Adding these would require a much broader discussion on hate speech filtering)

  // Self-harm related
  // "suicide", "self-harm", "cutting"
];


export const ALL_TAGS_WITH_CATEGORY_ID: Tag[] = CATEGORIES.flatMap(category => {
  let tagsFromCategory: Tag[] = [];
  if (category.tags) {
    tagsFromCategory = category.tags.map(tag => ({
      ...tag,
      id: `${category.id}-${tag.id}`, 
      categoryId: category.id,
      allowMultipleSelections: category.allowMultipleSelections 
    }));
  }
  if (category.subCategories) {
    const tagsFromSubCategories = category.subCategories.flatMap(subCat =>
      subCat.tags.map(tag => ({
        ...tag,
        id: `${category.id}-${subCat.id}-${tag.id}`, 
        categoryId: category.id,
        subCategoryId: subCat.id,
        allowMultipleSelections: category.allowMultipleSelections 
      }))
    );
    tagsFromCategory = [...tagsFromCategory, ...tagsFromSubCategories];
  }
  return tagsFromCategory;
});
