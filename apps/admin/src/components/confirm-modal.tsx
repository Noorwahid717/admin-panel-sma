import React from "react";
import { Modal } from "antd";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  content?: React.ReactNode;
  okText?: string;
  cancelText?: string;
  onOk: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = "Konfirmasi",
  content,
  okText = "Ya",
  cancelText = "Batal",
  onOk,
  onCancel,
  confirmLoading = false,
}) => {
  return (
    <Modal
      open={open}
      title={title}
      onOk={onOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      confirmLoading={confirmLoading}
    >
      {content}
    </Modal>
  );
};
