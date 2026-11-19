package com.laboratory.model;

import com.laboratory.processing.TestProcessingReport;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.util.List;

@Entity
@DiscriminatorValue("BIOCHEMISTRY_TEST")
public class BiochemistryTest extends LaboratoryTest {

    public BiochemistryTest() {
        super();
    }

    @Override
    public TestCategory resolveCategory() {
        return TestCategory.BIOCHEMISTRY_TEST;
    }

    @Override
    public TestProcessingReport processTest(Sample sample) {
        List<String> steps = List.of(
                "1. Clot-activate and separate serum fraction for sample " + sample.getSampleCode(),
                "2. Calibrate clinical chemistry analyzer using dual-point enzymatic standards",
                "3. Measure spectrophotometric absorbance at 340 nm / 546 nm",
                "4. Validate kinetic reaction slope and compare to " + getNormalRange() + " " + getUnit()
        );
        return buildReport(
                sample,
                TestCategory.BIOCHEMISTRY_TEST,
                steps,
                "BiochemistryTest processor completed photometric enzymatic assay via " + getProcessingProcedure()
        );
    }
}
