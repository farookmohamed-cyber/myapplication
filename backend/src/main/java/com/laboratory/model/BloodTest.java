package com.laboratory.model;

import com.laboratory.processing.TestProcessingReport;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.util.List;

@Entity
@DiscriminatorValue("BLOOD_TEST")
public class BloodTest extends LaboratoryTest {

    public BloodTest() {
        super();
    }

    @Override
    public TestCategory resolveCategory() {
        return TestCategory.BLOOD_TEST;
    }

    @Override
    public TestProcessingReport processTest(Sample sample) {
        List<String> steps = List.of(
                "1. Verify venipuncture blood specimen integrity and barcode (" + sample.getSampleCode() + ")",
                "2. Centrifuge whole blood at 3,200 RPM for 10 minutes to separate plasma fraction",
                "3. Run automated immunoassay and baseline serology calibration",
                "4. Cross-check quality control controls against normal reference window (" + getNormalRange() + " " + getUnit() + ")"
        );
        return buildReport(
                sample,
                TestCategory.BLOOD_TEST,
                steps,
                "BloodTest processor completed plasma separation and serological assay via " + getProcessingProcedure()
        );
    }
}
