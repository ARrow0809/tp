
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
  {
    id: 'styleArt', name: '画風', color: 'bg-sky-600', textColor: 'text-sky-100',
    tags: [
      { id: 'sa1', name: 'photorealistic', japaneseName: '写真風リアル' },
      { id: 'sa2', name: 'anime style', japaneseName: 'アニメ風' },
      { id: 'sa3', name: 'manga style', japaneseName: '漫画風' },
      { id: 'sa4', name: 'illustration', japaneseName: 'イラスト風' },
      { id: 'sa5', name: 'oil painting', japaneseName: '油絵風' },
      { id: 'sa6', name: 'watercolor', japaneseName: '水彩画風' },
      { id: 'sa7', name: 'sketch', japaneseName: 'スケッチ風' },
      { id: 'sa8', name: 'pixel art', japaneseName: 'ドット絵風' },
      { id: 'sa9', name: '3d render', japaneseName: '3Dレンダー' },
      { id: 'sa10', name: '16:9 aspect ratio', japaneseName: '16:9 比率' },
      { id: 'sa11', name: '9:16 aspect ratio', japaneseName: '9:16 比率' },
    ]
  },
  {
    id: 'features', name: '特徴', color: 'bg-indigo-600', textColor: 'text-indigo-100',
    subCategories: [
      { id: 'race', name: '種族', tags: [
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
      ]},
      { id: 'gender', name: '性別', tags: [
        { id: 'g1', name: '1girl', japaneseName: '女性1人' },
        { id: 'g1a', name: 'woman', japaneseName: '女性' },
        { id: 'g2', name: '1boy', japaneseName: '男性1人' },
        { id: 'g2a', name: 'man', japaneseName: '男性' },
        { id: 'g3', name: 'futanari', japaneseName: 'ふたなり' },
      ]},
      { id: 'age', name: '年齢', tags: [
        { id: 'a1', name: 'child', japaneseName: '子供' },
        { id: 'a1a', name: 'toddler', japaneseName: '幼児' },
        { id: 'a2', name: 'teenager', japaneseName: '10代' },
        { id: 'a3', name: 'young adult', japaneseName: '若者 (20代)' },
        { id: 'a4', name: 'adult', japaneseName: '成人 (30代)' },
        { id: 'a5', name: 'middle-aged', japaneseName: '中年 (40代)' },
        { id: 'a6', name: 'elderly woman', japaneseName: '年配の女性' },
        { id: 'a7', name: 'elderly man', japaneseName: '年配の男性' },
      ]},
    ]
  },
  {
    id: 'face', name: '顔', color: 'bg-purple-600', textColor: 'text-purple-100',
    subCategories: [
      { id: 'eyebrows', name: '眉毛', tags: [
        { id: 'fb1', name: 'arched eyebrows', japaneseName: 'アーチ眉' },
        { id: 'fb2', name: 'straight eyebrows', japaneseName: 'ストレート眉' },
        { id: 'fb3', name: 'worried eyebrows', japaneseName: '困り眉' },
        { id: 'fb4', name: 'thick eyebrows', japaneseName: '太い眉' },
      ]},
      { id: 'eyelashes', name: 'まつ毛', tags: [
        { id: 'fl1', name: 'long eyelashes', japaneseName: '長いまつ毛' },
        { id: 'fl2', name: 'thick eyelashes', japaneseName: '濃いまつ毛'},
      ]},
      { id: 'eyes', name: '目の形・色', tags: [
        { id: 'fe1', name: 'tsurime', japaneseName: 'つり目' },
        { id: 'fe2', name: 'tareme', japaneseName: 'たれ目' },
        { id: 'fe3', name: 'closed eyes', japaneseName: '閉じ目' },
        { id: 'fe4', name: 'wide-eyed', japaneseName: '見開き目' },
        { id: 'fe5', name: 'upturned eyes', japaneseName: '上目遣い' },
        { id: 'fe6', name: 'heterochromia', japaneseName: 'オッドアイ' },
        { id: 'fe7', name: 'blue eyes', japaneseName: '青い目' },
        { id: 'fe8', name: 'red eyes', japaneseName: '赤い目' },
        { id: 'fe9', name: 'green eyes', japaneseName: '緑の目' },
      ]},
      { id: 'pupils', name: '瞳孔', tags: [
        { id: 'fp1', name: 'sparkling eyes', japaneseName: 'キラキラした瞳' },
        { id: 'fp2', name: 'star-shaped pupils', japaneseName: '星型瞳孔' },
        { id: 'fp3', name: 'heart-shaped pupils', japaneseName: 'ハート型瞳孔' },
        { id: 'fp4', name: 'slit pupils', japaneseName: '猫のような瞳孔' },
      ]},
      { id: 'undereye', name: '目の下', tags: [
        { id: 'fu1', name: 'eyebags', japaneseName: '涙袋' },
        { id: 'fu2', name: 'dark circles', japaneseName: '目のクマ' },
      ]},
      { id: 'nose', name: '鼻', tags: [
        { id: 'fn1', name: 'small nose', japaneseName: '小さい鼻' },
        { id: 'fn2', name: 'aquiline nose', japaneseName: '鷲鼻' },
        { id: 'fn3', name: 'button nose', japaneseName: '団子鼻' },
      ]},
      { id: 'mouth', name: '口・唇', tags: [
        { id: 'fm1', name: 'small mouth', japaneseName: '小さい口' },
        { id: 'fm2', name: 'full lips', japaneseName: '厚い唇' },
        { id: 'fm3', name: 'open mouth', japaneseName: '開いた口' },
        { id: 'fm4', name: 'tongue out', japaneseName: '舌出し' },
      ]},
      { id: 'faceShape', name: '顔の輪郭', tags: [
        { id: 'ff1', name: 'oval face', japaneseName: '卵型の顔' },
        { id: 'ff2', name: 'round face', japaneseName: '丸顔' },
        { id: 'ff3', name: 'square face', japaneseName: '四角い顔' },
        { id: 'ff4', name: 'sharp chin', japaneseName: '尖った顎' },
      ]},
      { id: 'otherFaceFeatures', name: 'その他の顔特徴', tags: [
        { id: 'off1', name: 'mole', japaneseName: 'ほくろ' },
        { id: 'off2', name: 'freckles', japaneseName: 'そばかす' },
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
    id: 'input', name: '入力', color: 'bg-gray-500', textColor: 'text-gray-100', isInputCategory: true,
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
