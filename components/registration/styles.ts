/**
 * Shared styles for registration form steps
 */

import { StyleSheet } from 'react-native';

export const registrationStyles = StyleSheet.create({
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifiedText: {
    fontWeight: '600',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifyButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 15,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderText: {
    fontWeight: '500',
    fontSize: 14,
  },
  programTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  programTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  programTypeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  programScrollContainer: {
    marginHorizontal: -4,
  },
  programScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 10,
    flexDirection: 'row',
  },
  programChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    maxWidth: 150,
  },
  programChipText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  noProgramsText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    marginLeft: 4,
  },
  selectedProgram: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  numberSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  stepButtonContainer: {
    marginTop: 24,
    alignItems: 'flex-end',
  },
  stepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 140,
  },
  stepButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
