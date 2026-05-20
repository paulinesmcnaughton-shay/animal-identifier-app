/**
 * Avatar Shuffle pool — animals only (no tester photo).
 * All images bundled under assets/images/avatars/ for offline use.
 * Re-download: npm run download-avatars
 */
export const AVATAR_SHUFFLE_CATALOG = [
  { id: 'fox', label: 'Red Fox', image: require('@/assets/images/red-fox-hero.jpg') },
  {
    id: 'gecko',
    label: 'Crested Gecko',
    image: require('@/assets/images/crested-gecko-featured.jpg'),
  },
  {
    id: 'owl',
    label: 'Barn Owl',
    image: require('@/assets/images/Scan_onboarding_image.png'),
  },
  { id: 'dog-labrador', label: 'Labrador', image: require('@/assets/images/avatars/dog-labrador.jpg') },
  { id: 'dog-golden', label: 'Golden Retriever', image: require('@/assets/images/avatars/dog-golden.jpg') },
  { id: 'dog-beagle', label: 'Beagle', image: require('@/assets/images/avatars/dog-beagle.jpg') },
  {
    id: 'dog-french-bulldog',
    label: 'French Bulldog',
    image: require('@/assets/images/avatars/dog-french-bulldog.jpg'),
  },
  { id: 'dog-husky', label: 'Siberian Husky', image: require('@/assets/images/avatars/dog-husky.jpg') },
  { id: 'cat-tabby', label: 'Tabby Cat', image: require('@/assets/images/avatars/cat-tabby.jpg') },
  { id: 'cat-maine-coon', label: 'Maine Coon', image: require('@/assets/images/avatars/cat-maine-coon.jpg') },
  { id: 'rabbit', label: 'Rabbit', image: require('@/assets/images/avatars/rabbit.jpg') },
  { id: 'horse', label: 'Horse', image: require('@/assets/images/avatars/horse.jpg') },
  { id: 'cow', label: 'Cow', image: require('@/assets/images/avatars/cow.jpg') },
  { id: 'sheep', label: 'Sheep', image: require('@/assets/images/avatars/sheep.jpg') },
  { id: 'pig', label: 'Pig', image: require('@/assets/images/avatars/pig.jpg') },
  { id: 'goat', label: 'Goat', image: require('@/assets/images/avatars/goat.jpg') },
  { id: 'chicken', label: 'Chicken', image: require('@/assets/images/avatars/chicken.jpg') },
  { id: 'duck', label: 'Duck', image: require('@/assets/images/avatars/duck.jpg') },
  { id: 'parrot', label: 'Macaw', image: require('@/assets/images/avatars/parrot.jpg') },
  { id: 'hamster', label: 'Hamster', image: require('@/assets/images/avatars/hamster.jpg') },
  { id: 'goldfish', label: 'Goldfish', image: require('@/assets/images/avatars/goldfish.jpg') },
  {
    id: 'monarch',
    label: 'Monarch Butterfly',
    image: require('@/assets/images/avatars/monarch.jpg'),
  },
  { id: 'bumblebee', label: 'Bumblebee', image: require('@/assets/images/avatars/bumblebee.jpg') },
  { id: 'deer', label: 'White-tailed Deer', image: require('@/assets/images/avatars/deer.jpg') },
  { id: 'squirrel', label: 'Squirrel', image: require('@/assets/images/avatars/squirrel.jpg') },
  { id: 'turtle', label: 'Box Turtle', image: require('@/assets/images/avatars/turtle.jpg') },
  { id: 'dolphin', label: 'Dolphin', image: require('@/assets/images/avatars/dolphin.jpg') },
  { id: 'penguin', label: 'Emperor Penguin', image: require('@/assets/images/avatars/penguin.jpg') },
] as const

export type ShuffleAvatarPresetId = (typeof AVATAR_SHUFFLE_CATALOG)[number]['id']
