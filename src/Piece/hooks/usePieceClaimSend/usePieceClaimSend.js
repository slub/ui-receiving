import noop from 'lodash/noop';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useIntl } from 'react-intl';

import {
  getAcqMethodLabel,
  PIECE_STATUS,
  useAcquisitionMethods,
  useClaimsSend,
  useModalToggle,
  useOrganization,
  usePiecesStatusBatchUpdate,
} from '@folio/stripes-acq-components';

const DEFAULT_CLAIMS = [];

export const usePieceClaimSend = (options = {}) => {
  const {
    order,
    orderLine,
    piece,
    tenantId,
    title,
  } = options;

  const intl = useIntl();
  const confirmClaimSendPromise = useRef(Promise);
  const [isClaimSendModalOpen, toggleClaimSendModal] = useModalToggle();
  const [claimSendModalProps, setClaimSendModalProps] = useState({});

  /* Callback to handle claim send after form submit */
  const [sendClaimsHandler, setSendClaimsHandler] = useState(() => noop);

  const {
    isLoading: isClaimSendLoading,
    sendClaims,
  } = useClaimsSend({ tenantId });

  const {
    isLoading: isUpdatePiecesStatusLoading,
    updatePiecesStatus,
  } = usePiecesStatusBatchUpdate({ tenantId });

  const isLoading = isClaimSendLoading || isUpdatePiecesStatusLoading;

  /* Names for the "no matching integration" warning of the modal, only needed while it is open */
  const { organization } = useOrganization(order?.vendor, { enabled: isClaimSendModalOpen, tenantId });
  const { acquisitionMethods } = useAcquisitionMethods({ enabled: isClaimSendModalOpen, tenantId });

  /* The piece as the "Send claims" modal needs it to tell how the piece will be claimed */
  const claims = useMemo(() => {
    if (!piece?.id) return DEFAULT_CLAIMS;

    const acquisitionMethod = acquisitionMethods.find(({ id }) => id === orderLine?.acquisitionMethod);

    return [{
      ...piece,
      title: title?.title,
      vendorId: order?.vendor,
      vendorCode: organization?.code,
      vendorName: organization?.name,
      acquisitionMethod: orderLine?.acquisitionMethod,
      acquisitionMethodName: acquisitionMethod && getAcqMethodLabel(acquisitionMethod, { intl }),
      claimSequenceId: orderLine?.claimSequenceId,
    }];
  }, [acquisitionMethods, intl, order?.vendor, orderLine, organization, piece, title?.title]);

  /* Trigger "Send claims" modal rendering with dynamic props */
  const onClaimSend = useCallback(({ internalNote, externalNote }) => {
    toggleClaimSendModal();

    return new Promise((resolve, reject) => {
      confirmClaimSendPromise.current = { resolve, reject };

      setClaimSendModalProps({
        initialValues: { internalNote, externalNote },
      });
    });
  }, [toggleClaimSendModal]);

  /* Resolves the "Send claims" modal promise and set the "sendClaimsHandler" callback to handle after form submit */
  const onConfirmClaimSend = useCallback(({
    claimingInterval,
    externalNote,
    internalNote,
    statusOnlyPieceIds,
  }) => {
    // Without a matching integration nothing is sent, the piece only gets the "Claim sent" status
    const isStatusOnly = Boolean(statusOnlyPieceIds?.length);

    const callback = async ({ id }) => {
      const result = isStatusOnly
        ? await updatePiecesStatus({
          data: {
            claimingInterval,
            pieceIds: [id],
            receivingStatus: PIECE_STATUS.claimSent,
            internalNote,
            externalNote,
          },
        })
        : await sendClaims({
          data: {
            claimingInterval,
            claimingPieceIds: [id],
            internalNote,
            externalNote,
          },
        });

      return result;
    };

    toggleClaimSendModal();
    setSendClaimsHandler(() => callback);

    confirmClaimSendPromise.current.resolve({
      claimingInterval,
      externalNote,
      internalNote,
    });
  }, [sendClaims, toggleClaimSendModal, updatePiecesStatus]);

  const onCancelClaimSend = useCallback(() => {
    toggleClaimSendModal();
  }, [toggleClaimSendModal]);

  return {
    claims,
    claimSendModalProps,
    isClaimSendModalOpen,
    onCancelClaimSend,
    onConfirmClaimSend,
    onClaimSend,
    sendClaimsHandler,
    isLoading,
  };
};
