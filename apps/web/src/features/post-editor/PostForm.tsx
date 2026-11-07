import { CameraOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { invalidatePosts, type Post } from '@/entities/post';
import { imageErrorMessage, pickAndUploadImages, request, type ImageSource } from '@/shared/api';
import { isNativeApp } from '@/shared/bridge';
import { srOnly } from '@/shared/ui';
import * as s from './PostForm.css';

const MAX_IMAGES = 5;

export function PostForm() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { message } = App.useApp();
  const [images, setImages] = useState<{ url: string; alt: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [captionError, setCaptionError] = useState(false);

  const create = useMutation({
    mutationFn: (data: { caption: string; images: { url: string; alt: string }[] }) =>
      request<Post>('/posts', { method: 'POST', body: data }),
    onSuccess: async () => {
      await invalidatePosts(client);
      navigate('/', { replace: true });
    },
  });

  const pick = async (source: ImageSource) => {
    setUploading(true);
    try {
      const urls = await pickAndUploadImages(source, MAX_IMAGES - images.length);
      setImages((prev) => [...prev, ...urls.map((url) => ({ url, alt: '' }))]);
    } catch (error) {
      void message.error(imageErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    if (!caption.trim()) {
      setCaptionError(true);
      return;
    }
    if (!create.isPending) create.mutate({ caption, images });
  };

  return (
    <Form layout="vertical" className={s.form} onFinish={submit}>
      <p className={s.hint}>사진 {images.length} / {MAX_IMAGES}장</p>
      <div className={s.pickRow}>
        <Button icon={<PictureOutlined aria-hidden="true" />} loading={uploading} disabled={images.length >= MAX_IMAGES} onClick={() => void pick('gallery')}>
          앨범에서 선택
        </Button>
        {isNativeApp() && (
          <Button icon={<CameraOutlined aria-hidden="true" />} disabled={uploading || images.length >= MAX_IMAGES} onClick={() => void pick('camera')}>
            촬영
          </Button>
        )}
      </div>
      {images.length > 0 && (
        <ul className={s.images}>
          {images.map((image, i) => (
            <li key={image.url} className={s.imageRow}>
              <img className={s.thumb} src={image.url} alt="" />
              <div>
                <label htmlFor={`alt-${i}`} className={srOnly}>{i + 1}번째 사진 설명</label>
                <Input
                  id={`alt-${i}`}
                  placeholder="사진 설명 (화면 낭독용)"
                  maxLength={200}
                  value={image.alt}
                  onChange={(e) => setImages((prev) => prev.map((it, j) => (j === i ? { ...it, alt: e.target.value } : it)))}
                />
              </div>
              <Button
                aria-label={`${i + 1}번째 사진 삭제`}
                icon={<DeleteOutlined aria-hidden="true" />}
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
              />
            </li>
          ))}
        </ul>
      )}
      <Form.Item
        label="내용"
        htmlFor="post-caption"
        validateStatus={captionError ? 'error' : undefined}
        help={captionError ? '내용을 입력해 주세요.' : undefined}
        style={{ marginBottom: 36 }}
      >
        <Input.TextArea
          id="post-caption"
          rows={5}
          maxLength={2200}
          showCount
          value={caption}
          onChange={(e) => {
            setCaption(e.target.value);
            setCaptionError(false);
          }}
        />
      </Form.Item>
      {create.error && <Form.Item><Alert type="error" title={create.error.message} /></Form.Item>}
      <Button type="primary" htmlType="submit" block loading={create.isPending} disabled={images.length === 0 || uploading}>
        게시하기
      </Button>
      {images.length === 0 && <p className={s.hint} style={{ marginTop: 8 }}>사진을 1장 이상 선택하면 게시할 수 있습니다.</p>}
    </Form>
  );
}
