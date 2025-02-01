import { uploadFile } from './fileUpload';
import { DeltaStatic, Sources } from 'quill';
import toast from 'react-hot-toast';

// Character counter function
function countCharacters(delta: DeltaStatic): number {
  return delta.reduce((acc, op) => {
    if (typeof op.insert === 'string') {
      return acc + op.insert.length;
    }
    return acc + 1; // Count non-string inserts (e.g., images) as 1 character
  }, 0);
}

function imageHandler() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.style.display = 'none';
    document.body.appendChild(input);
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const toastId = toast.loading('Uploading image...');
          const url = await uploadFile(file, 'blog-');
          toast.dismiss(toastId);
          toast.success('Image uploaded successfully');
          resolve(url);
        } catch (error) {
          console.error('Failed to upload image:', error);
          toast.error('Failed to upload image. Please try again.');
          resolve(false);
        }
      }
      document.body.removeChild(input);
    };
  });
}

export const QuillModules = {
  toolbar: {
    container: [
      [{ 'header': [2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    handlers: {
      'image': imageHandler
    }
  },
  clipboard: {
    matchVisual: false
  },
  keyboard: {
    bindings: {
      tab: {
        key: 9,
        handler: function() {
          return true; // Let default tab behavior work
        }
      }
    }
  },
  history: {
    delay: 1000,
    maxStack: 500,
    userOnly: true
  },
};

export const QuillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'align',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link', 'image',
  'clean'
];